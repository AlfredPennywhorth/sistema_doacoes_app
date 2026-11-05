/**
 * Retorna apenas coordenadas explicitamente classificadas como publicas.
 * Nunca use latitude/longitude privadas como fallback.
 * A API do MapLibre utiliza a ordem [longitude, latitude].
 */
export interface PublicCoordinatesSource {
  public_latitude?: number | string | null;
  public_longitude?: number | string | null;
}

export function getPublicMapCoordinates(item: PublicCoordinatesSource): [number, number] | null {
  const { public_latitude, public_longitude } = item;

  if (
    public_latitude === null || public_latitude === undefined || public_latitude === '' ||
    public_longitude === null || public_longitude === undefined || public_longitude === ''
  ) {
    return null;
  }

  const latitude = Number(public_latitude);
  const longitude = Number(public_longitude);

  if (
    !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    latitude < -90 || latitude > 90 ||
    longitude < -180 || longitude > 180
  ) {
    return null;
  }

  return [longitude, latitude];
}
