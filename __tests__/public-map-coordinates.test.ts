import { getPublicMapCoordinates } from '../src/utils/publicMapCoordinates';

describe('Coordenadas do mapa publico', () => {
  it('usa somente coordenadas explicitamente publicas na ordem MapLibre', () => {
    expect(getPublicMapCoordinates({
      public_latitude: -23.5505,
      public_longitude: -46.6333,
      // Mesmo que coordenadas privadas estejam presentes, elas nao substituem as publicas.
      latitude: -23.555555,
      longitude: -46.666666,
    } as any)).toEqual([-46.6333, -23.5505]);
  });

  it('nunca usa coordenadas privadas como fallback', () => {
    expect(getPublicMapCoordinates({
      latitude: -23.555555,
      longitude: -46.666666,
    } as any)).toBeNull();
    expect(getPublicMapCoordinates({
      public_latitude: null,
      public_longitude: null,
      latitude: -23.555555,
      longitude: -46.666666,
    } as any)).toBeNull();
  });

  it('rejeita publicas ausentes, vazias ou fora do intervalo', () => {
    expect(getPublicMapCoordinates({ public_latitude: '', public_longitude: '-46' })).toBeNull();
    expect(getPublicMapCoordinates({ public_latitude: -23, public_longitude: null })).toBeNull();
    expect(getPublicMapCoordinates({ public_latitude: 91, public_longitude: 45 })).toBeNull();
    expect(getPublicMapCoordinates({ public_latitude: -23, public_longitude: -181 })).toBeNull();
    expect(getPublicMapCoordinates({ public_latitude: 'NaN', public_longitude: 0 })).toBeNull();
  });

  it('aceita coordenadas publicas validas mesmo quando zero', () => {
    expect(getPublicMapCoordinates({ public_latitude: 0, public_longitude: 0 })).toEqual([0, 0]);
  });
});
