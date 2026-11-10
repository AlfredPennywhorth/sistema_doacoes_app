/**
 * Pesquisa de geocodificação SOMENTE de endereços institucionais públicos,
 * acionada expressamente pelo administrador. Nunca enviar dados residenciais.
 *
 * Photon/komoot é serviço público de demonstração, sujeito a limites e sem
 * SLA. Não usar como geocodificação em massa nem em cada visita ao mapa.
 * Após conferência, as coordenadas deverão ser persistidas no galpão.
 */
export type WarehouseGeocodeCandidate = {
  label: string;
  latitude: number;
  longitude: number;
};
type PhotonFeature = {
  geometry?: { type?: string; coordinates?: unknown };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
};

export function parseWarehouseGeocodeResults(payload: unknown): WarehouseGeocodeCandidate[] {
  if (!payload || typeof payload !== 'object') return [];
  const data = payload as { features?: unknown };
  if (!Array.isArray(data.features)) return [];

  const candidates: WarehouseGeocodeCandidate[] = [];
  for (const feature of data.features.slice(0, 5) as PhotonFeature[]) {
    const coords = feature.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;
    const [longitude, latitude] = coords.map(Number);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    // Galpões da Regional SP. Bloqueia resultados de outros países.
    if (latitude < -26 || latitude > -19 || longitude < -54 || longitude > -44) continue;
    const info = feature.properties ?? {};
    const label = [
      [info.street, info.housenumber].filter(Boolean).join(', '),
      info.district,
      info.city,
      info.state,
      info.postcode,
    ].filter(Boolean).join(' — ') || info.name || 'Localização sugerida';
    if (!candidates.some((candidate) =>
      candidate.latitude === latitude && candidate.longitude === longitude
    )) {
      candidates.push({ label, latitude, longitude });
    }
  }
  return candidates;
}

export async function geocodePublicWarehouse(address: string): Promise<WarehouseGeocodeCandidate[]> {
  if (address.trim().length < 10) throw new Error('Informe o endereço completo.');
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', address.trim() + ', São Paulo, Brasil');
  url.searchParams.set('limit', '5');
  url.searchParams.set('lang', 'pt');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('Serviço de localização indisponível. Tente novamente.');
    return parseWarehouseGeocodeResults(await response.json());
  } finally {
    clearTimeout(timeout);
  }
}
