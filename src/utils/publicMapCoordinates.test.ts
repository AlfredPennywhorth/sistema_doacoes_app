import { getPublicMapCoordinates } from './publicMapCoordinates';

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
