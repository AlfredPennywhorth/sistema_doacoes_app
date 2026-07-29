export interface AddressByCep {
  cep: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  ibgeCode?: string;
  source: 'brasilapi' | 'viacep';
}

const timeoutPromise = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms));

/**
 * Busca endereço pelo CEP na BrasilAPI com fallback para ViaCEP
 */
export async function lookupAddressByCep(cep: string): Promise<AddressByCep> {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) {
    throw new Error('INVALID_INPUT');
  }

  try {
    // 1. Tenta BrasilAPI
    const brasilApiRes = await Promise.race([
      fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCep}`),
      timeoutPromise(5000)
    ]) as Response;

    if (brasilApiRes.ok) {
      const data = await brasilApiRes.json();
      return {
        cep: data.cep,
        street: data.street,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        ibgeCode: undefined, // BrasilAPI v1 usually doesn't return IBGE code, v2 does, but let's stick to safe mapping
        source: 'brasilapi'
      };
    }
  } catch (error) {
    console.warn('[lookupAddressByCep] BrasilAPI falhou, tentando fallback (ViaCEP)...', error);
  }

  // 2. Fallback ViaCEP
  try {
    const viaCepRes = await Promise.race([
      fetch(`https://viacep.com.br/ws/${cleanCep}/json/`),
      timeoutPromise(5000)
    ]) as Response;

    if (viaCepRes.ok) {
      const data = await viaCepRes.json();
      if (data.erro) {
        throw new Error('NOT_FOUND');
      }
      return {
        cep: data.cep.replace('-', ''),
        street: data.logradouro,
        neighborhood: data.bairro,
        city: data.localidade,
        state: data.uf,
        ibgeCode: data.ibge,
        source: 'viacep'
      };
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'NOT_FOUND') {
      throw error;
    }
    console.error('[lookupAddressByCep] ViaCEP também falhou:', error);
    throw new Error('NETWORK_ERROR');
  }

  throw new Error('NOT_FOUND');
}
