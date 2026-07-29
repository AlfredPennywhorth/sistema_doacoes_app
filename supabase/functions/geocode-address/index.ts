import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Simple in-memory cache for edge function instances (resets when instances are scaled/restarted)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { address } = body;

    if (!address) {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build Nominatim query
    // address expected format: { street, number, city, state, cep }
    const qParams = new URLSearchParams();
    if (address.street) qParams.append('street', `${address.number ? address.number + ' ' : ''}${address.street}`);
    if (address.city) qParams.append('city', address.city);
    if (address.state) qParams.append('state', address.state);
    if (address.cep) qParams.append('postalcode', address.cep);
    qParams.append('country', 'Brazil');
    qParams.append('format', 'json');
    qParams.append('limit', '1');

    const cacheKey = qParams.toString();

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Add a minimal delay to respect Nominatim 1 req/sec limits across multiple rapid requests 
    // (This is simple and applies per instance, but global rate limiting requires redis. For this scale, it helps)
    await new Promise(r => setTimeout(r, 1000));

    // Nominatim URL
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?${cacheKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

    const response = await fetch(nominatimUrl, {
      headers: {
        // Required by Nominatim Policy
        'User-Agent': 'SistemaDeDoacoesApp/1.0 (test@example.com)' // Ideally, configure email via env
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Nominatim responded with status: ${response.status}`);
    }

    const data = await response.json();

    let result = null;
    if (data && data.length > 0) {
      result = {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        displayName: data[0].display_name,
        source: 'nominatim'
      };
      
      // Save to cache
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
