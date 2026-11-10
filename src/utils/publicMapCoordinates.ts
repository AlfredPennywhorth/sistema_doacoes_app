/**
 * Retorna apenas coordenadas explicitamente classificadas como publicas.
 * Nunca use latitude/longitude privadas como fallback.
 * A API do MapLibre utiliza a ordem [longitude, latitude].
 */
export interface PublicCoordinatesSource {
  warehouse_id?: string | null;
  warehouse?: {
    latitude?: number | string | null;
    longitude?: number | string | null;
    is_active?: boolean | null;
    public_map_approved?: boolean | null;
  } | null;
  public_latitude?: number | string | null;
  public_longitude?: number | string | null;
}

// Para galpões, localização exata só é pública quando houver aprovação
// explícita registrada no backend. is_active NÃO significa autorização.
function validCoordinates(latitudeRaw: number | string | null | undefined, longitudeRaw: number | string | null | undefined): [number, number] | null {
  if (latitudeRaw === null || latitudeRaw === undefined || latitudeRaw === '' ||
      longitudeRaw === null || longitudeRaw === undefined || longitudeRaw === '') return null;

  const latitude = Number(latitudeRaw);
  const longitude = Number(longitudeRaw);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return [longitude, latitude];
}

/** Retorna apenas coordenadas explicitamente classificadas como públicas.
 * Nunca utiliza items.latitude / items.longitude como fallback.
 * Ordem MapLibre: [longitude, latitude].
 */
export function getPublicMapCoordinates(item: PublicCoordinatesSource): [number, number] | null {
  const institutional = item.warehouse;
  if (item.warehouse_id && institutional?.is_active === true &&
      institutional.public_map_approved === true) {
    const warehousePoint = validCoordinates(institutional.latitude, institutional.longitude);
    if (warehousePoint) return warehousePoint;
  }
  return validCoordinates(item.public_latitude, item.public_longitude);
}
