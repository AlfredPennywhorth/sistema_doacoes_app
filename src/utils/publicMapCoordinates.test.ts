import { getPublicMapCoordinates, groupDonationsByPublicLocation } from './publicMapCoordinates';

describe('getPublicMapCoordinates', () => {
  it('exibe a coordenada de galpao institucional ativo', () => {
    expect(getPublicMapCoordinates({
      warehouse_id: 'institucional',
      warehouse: { is_active: true, latitude: -23.55, longitude: -46.63 },
    })).toEqual([-46.63, -23.55]);
  });

  it('nao usa coordenadas institucionais de galpao inativo', () => {
    expect(getPublicMapCoordinates({
      warehouse_id: 'institucional',
      warehouse: { is_active: false, latitude: -23.55, longitude: -46.63 },
    })).toBeNull();
  });

  it('nao utiliza latitude e longitude privadas do item residencial', () => {
    const legacyResidential = {
      latitude: -23.55,
      longitude: -46.63,
      pickup_address: 'Endereco privado de teste',
    };
    expect(getPublicMapCoordinates(legacyResidential)).toBeNull();
  });

  it('aceita apenas coordenadas publicas validas', () => {
    expect(getPublicMapCoordinates({
      public_latitude: -23.5, public_longitude: -46.6,
    })).toEqual([-46.6, -23.5]);
    expect(getPublicMapCoordinates({
      public_latitude: -100, public_longitude: -46.6,
    })).toBeNull();
  });

  it('nao usa coordenadas de galpao sem vinculo institucional', () => {
    expect(getPublicMapCoordinates({
      warehouse: { is_active: true, latitude: -23.55, longitude: -46.63 },
    })).toBeNull();
  });
});

describe('groupDonationsByPublicLocation', () => {
  it('agrupa doacoes no mesmo galpao sem perder nenhuma opcao de selecao', () => {
    const donations = [
      { id: 'a', warehouse_id: 'deposito', warehouse: { is_active: true, latitude: -23.55, longitude: -46.63 } },
      { id: 'b', warehouse_id: 'deposito', warehouse: { is_active: true, latitude: -23.55, longitude: -46.63 } },
      { id: 'c', public_latitude: -23.6, public_longitude: -46.7 },
    ];
    const groups = groupDonationsByPublicLocation(donations);
    expect(groups).toHaveLength(2);
    expect(groups[0].point).toEqual([-46.63, -23.55]);
    expect(groups[0].items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(groups[1].items.map((item) => item.id)).toEqual(['c']);
  });

  it('agrupa coordenadas publicas coincidentes de locais distintos', () => {
    const result = groupDonationsByPublicLocation([
      { id: 'a', public_latitude: -23.55, public_longitude: -46.63 },
      { id: 'b', public_latitude: -23.55, public_longitude: -46.63 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].items.map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('ignora dados residenciais legados, privados, sem marcador', () => {
    const result = groupDonationsByPublicLocation([
      { id: 'private', latitude: -23.5, longitude: -46.6 },
      { id: 'institutional', warehouse_id: 'inactive', warehouse: { is_active: false, latitude: -23.5, longitude: -46.6 } },
    ]);
    expect(result).toEqual([]);
  });
});
