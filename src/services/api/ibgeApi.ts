export interface BrazilianState {
  id: number;
  acronym: string;
  name: string;
}

export interface BrazilianCity {
  id: number;
  name: string;
}

const statesCache: { data: BrazilianState[] | null; timestamp: number } = { data: null, timestamp: 0 };
const citiesCache = new Map<number, { data: BrazilianCity[]; timestamp: number }>();

const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

export async function getBrazilianStates(): Promise<BrazilianState[]> {
  if (statesCache.data && Date.now() - statesCache.timestamp < CACHE_TTL) {
    return statesCache.data;
  }

  try {
    const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados');
    if (!res.ok) throw new Error('NETWORK_ERROR');
    
    const data = await res.json();
    const formatted: BrazilianState[] = data.map((st: any) => ({
      id: st.id,
      acronym: st.sigla,
      name: st.nome
    })).sort((a: BrazilianState, b: BrazilianState) => a.name.localeCompare(b.name));

    statesCache.data = formatted;
    statesCache.timestamp = Date.now();
    return formatted;
  } catch (err) {
    console.error('[getBrazilianStates] Erro:', err);
    throw new Error('NETWORK_ERROR');
  }
}

export async function getCitiesByState(stateId: number): Promise<BrazilianCity[]> {
  const cached = citiesCache.get(stateId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateId}/municipios`);
    if (!res.ok) throw new Error('NETWORK_ERROR');
    
    const data = await res.json();
    const formatted: BrazilianCity[] = data.map((ct: any) => ({
      id: ct.id,
      name: ct.nome
    })).sort((a: BrazilianCity, b: BrazilianCity) => a.name.localeCompare(b.name));

    citiesCache.set(stateId, { data: formatted, timestamp: Date.now() });
    return formatted;
  } catch (err) {
    console.error('[getCitiesByState] Erro:', err);
    throw new Error('NETWORK_ERROR');
  }
}
