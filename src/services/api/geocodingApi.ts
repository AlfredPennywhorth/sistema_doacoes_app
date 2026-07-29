import { supabase } from '../../config/supabase';

export interface StructuredAddress {
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  ibgeCode?: string;
  reference?: string;
}

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName?: string;
  source: 'nominatim';
}

/**
 * Invokes the Supabase Edge Function to geocode an address.
 * NEVER calls Nominatim directly from the client.
 */
export async function geocodeAddress(
  address: StructuredAddress
): Promise<GeocodingResult | null> {
  if (!address.street || !address.city || !address.state) {
    return null; // Not enough data
  }

  try {
    const { data, error } = await supabase.functions.invoke('geocode-address', {
      body: { address }
    });

    if (error) {
      console.error('[geocodeAddress] Edge Function error:', error.message);
      return null;
    }

    if (data && data.latitude && data.longitude) {
      return data as GeocodingResult;
    }
    
    return null;
  } catch (err) {
    console.error('[geocodeAddress] Fetch error:', err);
    return null;
  }
}
