import { parseWarehouseGeocodeResults } from './warehouseGeocoding';

describe('parseWarehouseGeocodeResults', () => {
  it('aceita um ponto no estado de Sao Paulo com latitude/longitude em ordem correta', () => {
    expect(parseWarehouseGeocodeResults({
      features: [{
        geometry: { type: 'Point', coordinates: [-46.62, -23.55] },
        properties: { street: 'Rua teste', housenumber: '350', city: 'São Paulo', state: 'São Paulo' },
      }],
    })).toEqual([{
      longitude: -46.62, latitude: -23.55, label: 'Rua teste, 350 — São Paulo — São Paulo',
    }]);
  });

  it('ignora dados inválidos, fora de Sao Paulo e pontos duplicados', () => {
    const candidate = {
      geometry: { type: 'Point', coordinates: [-46.62, -23.55] },
      properties: { name: 'Almoxarifado' },
    };
    expect(parseWarehouseGeocodeResults({
      features: [
        candidate, candidate,
        { geometry: { type: 'Point', coordinates: [-58.4, -34.6] } },
        { geometry: { type: 'Point', coordinates: [null, 999] } },
      ],
    })).toEqual([{ longitude: -46.62, latitude: -23.55, label: 'Almoxarifado' }]);
  });

  it('nao transforma respostas malformadas em coordenadas inventadas', () => {
    expect(parseWarehouseGeocodeResults(null)).toEqual([]);
    expect(parseWarehouseGeocodeResults({ features: 'not-an-array' })).toEqual([]);
    expect(parseWarehouseGeocodeResults({ features: [{ properties: { name: 'Sem localizacao' } }] })).toEqual([]);
  });
});
