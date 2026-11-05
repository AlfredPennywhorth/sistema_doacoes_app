import { supabase } from '../config/supabase';

// Campos liberados para consultas gerais: nunca selecionar '*' da tabela items.
// GRANTs previstos em supabase/pending/20261105_secure_donations_draft.sql.
const PUBLIC_ITEM_COLUMNS = [
  'id', 'title', 'category', 'description', 'status', 'image_url',
  'ttl_days', 'expires_at', 'user_id', 'requested_by', 'reserved_at',
  'created_at', 'is_urgent', 'collected_at', 'warehouse_id',
  'city', 'state', 'public_latitude', 'public_longitude', 'location_precision'
].join(',');

const getAuthorizedPickup = async (itemId) => {
  const { data, error } = await supabase.rpc('get_donation_pickup', { p_item_id: itemId });
  if (error) {
    console.error('[getAuthorizedPickup] Falha ao consultar dados autorizados:', error.code || error.message);
    return null;
  }
  return Array.isArray(data) ? (data[0] || null) : null;
};


// ─── Itens / Doações ────────────────────────────────────────────────────────

export const getDonations = async (category = null, warehouseId = null, includeReserved = false) => {
    let query = supabase
        .from('items')
        .select(`${PUBLIC_ITEM_COLUMNS},donor:profiles!user_id(name),warehouse:warehouses(name,address)`);

    if (includeReserved) {
        query = query.in('status', ['available', 'reserved']);
    } else {
        query = query.eq('status', 'available');
    }

    query = query.order('created_at', { ascending: false });

    if (category && category !== 'TODOS') {
        query = query.eq('category', category);
    }

    if (warehouseId) {
        query = query.eq('warehouse_id', warehouseId);
    }

    const { data, error } = await query;
    if (error) { console.error('Erro ao buscar doações', error); return []; }
    return data;
};

export const getDonationById = async (id) => {
    const { data, error } = await supabase
        .from('items')
        .select(`${PUBLIC_ITEM_COLUMNS},donor:profiles!user_id(name),warehouse:warehouses(name,address)`)
        .eq('id', id);

    if (error) {
        console.error('[getDonationById] Erro na query:', error);
        return null;
    }

    if (!data || data.length === 0) return null;

    const item = data[0];
    // O servidor libera telefone e endereco somente para doador ou reservante.
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const pickup = await getAuthorizedPickup(item.id);
      if (pickup) {
        item.pickup_address = pickup.pickup_address;
        item.pickup_instructions = pickup.pickup_instructions;
        item.donor = { ...item.donor, phone: pickup.donor_phone };
      }
    }
    return item;
};

export const createDonation = async (itemData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Não autenticado' };

    const { data, error } = await supabase.rpc('create_donation_with_pickup_details', {
        p_title: itemData.title,
        p_description: itemData.description,
        p_category: itemData.category,
        p_image_url: itemData.image_url,
        p_warehouse_id: itemData.warehouse_id,
        p_cep: itemData.cep,
        p_street: itemData.street,
        p_number: itemData.number,
        p_complement: itemData.complement,
        p_neighborhood: itemData.neighborhood,
        p_city: itemData.city,
        p_state: itemData.state,
        p_reference_point: itemData.reference_point,
        p_latitude: itemData.latitude,
        p_longitude: itemData.longitude,
        p_instructions: itemData.pickup_instructions
    });

    if (error) { console.error('Erro ao criar doação via RPC', error); return { error: error.message }; }
    
    // Como a RPC retorna uuid, buscamos o item recém-criado
    const { data: createdItem, error: fetchErr } = await supabase
      .from('items')
      .select(PUBLIC_ITEM_COLUMNS)
      .eq('id', data)
      .single();

    if (fetchErr) {
       console.error('Erro ao buscar doação criada', fetchErr); return { error: fetchErr.message }; 
    }

    return { success: true, data: createdItem };
};

export const confirmItemCollection = async (itemId) => {
    const { data, error } = await supabase.rpc('complete_donation', { p_item_id: itemId });
    if (error || data !== true) {
        return { success: false, message: error?.message || 'Apenas o doador pode confirmar a retirada de um item reservado.' };
    }
    return { success: true };
};

export const deleteItem = async (itemId) => {
    const { data, error } = await supabase.rpc('delete_donation', { p_item_id: itemId });
    if (error || data !== true) {
        return { success: false, message: error?.message || 'Voce nao pode excluir este item.' };
    }
    return { success: true };
};

// ─── Minhas Reservas (Requerente) ──────────────────────────────────────────

export const getMyReservations = async (userId) => {
    const { data, error } = await supabase
        .from('items')
        .select(`${PUBLIC_ITEM_COLUMNS},donor:profiles!user_id(name),warehouse:warehouses(name,address)`)
        .eq('requested_by', userId)
        .eq('status', 'reserved')
        .order('reserved_at', { ascending: false });

    if (error) {
        console.error('[getMyReservations] Erro:', error);
        return [];
    }
    // A RPC confere auth.uid() e reserva ativa antes de retornar dados privados.
    return await Promise.all((data || []).map(async (item) => {
        const pickup = await getAuthorizedPickup(item.id);
        if (!pickup) return item;
        return {
          ...item,
          pickup_address: pickup.pickup_address,
          pickup_instructions: pickup.pickup_instructions,
          donor: { ...item.donor, phone: pickup.donor_phone }
        };
    }));
};

// ─── Minhas Doações (Doador) ──────────────────────────────────────────────

export const getMyDonations = async (userId) => {
    const { data, error } = await supabase
        .from('items')
        .select(`${PUBLIC_ITEM_COLUMNS},requester:profiles!requested_by(name),warehouse:warehouses(name,address)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('[getMyDonations] Erro:', error);
        return [];
    }
    return data;
};


// ─── Reserva atômica / Liberação ──────────────────────────────────────────

export const releaseItem = async (itemId, requestId = null) => {
    const { data, error } = await supabase.rpc('release_donation', { p_item_id: itemId });
    if (error || data !== true) {
        return { success: false, message: error?.message || 'A reserva nao pode ser liberada por esta conta.' };
    }
    if (requestId) {
      const { error: requestError } = await supabase.from('item_requests')
        .update({ status: 'open' }).eq('id', requestId);
      if (requestError) console.error('[releaseItem] Nao foi possivel reabrir pedido:', requestError);
    }
    return { success: true, message: 'Item liberado com sucesso.' };
};

export const requestItemWithLock = async (itemId) => {
    const { data, error } = await supabase.rpc('reserve_donation', { p_item_id: itemId });
    if (error || data !== true) {
        return { success: false, message: error?.message || 'O item nao esta disponivel para reserva.' };
    }
    return { success: true, message: 'Item reservado com sucesso!' };
};

// ─── Item Requests (Pedidos) ────────────────────────────────────────────────

export const getItemRequests = async (category = 'TODOS') => {
    try {
        let query = supabase
            .from('item_requests')
            .select(`
                *,
                requester:profiles!user_id(name)
            `)
            .eq('status', 'open')
            .order('created_at', { ascending: false });

        if (category !== 'TODOS') {
            query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[Database] Erro ao buscar pedidos:', error.message);
        return [];
    }
};

export const createItemRequest = async (requestData) => {
    try {
        const { data, error } = await supabase
            .from('item_requests')
            .insert([{
                ...requestData,
                created_at: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('[Database] Erro ao criar pedido:', error.message);
        return { success: false, error: error.message };
    }
};

export const fulfillItemRequest = async (requestId) => {
    try {
        const { error } = await supabase
            .from('item_requests')
            .update({ status: 'fulfilled' })
            .eq('id', requestId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('[Database] Erro ao atender pedido:', error.message);
        return { success: false, error: error.message };
    }
};

export const deleteItemRequest = async (requestId) => {
    try {
        const { error } = await supabase
            .from('item_requests')
            .delete()
            .eq('id', requestId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('[Database] Erro ao excluir pedido:', error.message);
        return { success: false, error: error.message };
    }
};

// ─── Galpões / Almoxarifados ────────────────────────────────────────────────

export const getWarehouses = async (includeInactive = false) => {
        let query = supabase
        .from('warehouses')
        .select('id, name, address, latitude, longitude, is_active, created_at');

    if (!includeInactive) {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('name');
    if (error) return [];
    return data;
};

export const createWarehouse = async (warehouseData) => {
    const { data, error } = await supabase
        .from('warehouses')
        .insert([warehouseData])
        .select();

    if (error) {
        console.error('[createWarehouse] Erro:', error);
        return { success: false, message: error.message };
    }
    return { success: true, data: data[0] };
};

export const updateWarehouse = async (id, updates) => {
    const { data, error } = await supabase
        .from('warehouses')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) {
        console.error('[updateWarehouse] Erro:', error);
        return { success: false, message: error.message };
    }
    return { success: true, data: data[0] };
};

// ─── Perfis e Admin ─────────────────────────────────────────────────────────

export const getProfile = async (userId) => {
        const { data, error } = await supabase
        .from('profiles')
        .select('id, name, is_admin')
        .eq('id', userId)
        .single();

    if (error) return null;
    return data;
};

// ─── Dashboard Stats ─────────────────────────────────────────────────────

export const getDashboardStats = async (filters = null) => {
    try {
        const { data, error } = await supabase
            .from('items')
            .select('id, category, status, collected_at, created_at');

        if (error) throw error;

        let filteredData = data;
        if (filters) {
            if (filters.category) {
                filteredData = filteredData.filter(item => item.category === filters.category);
            }
            if (filters.month) {
                filteredData = filteredData.filter(item => {
                    const date = new Date(item.created_at);
                    const monthLabel = `${monthNames[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`;
                    return monthLabel === filters.month;
                });
            }
        }

        const stats = {
            byCategory: {},
            byStatus: { available: 0, reserved: 0, donated: 0 },
            byMonth: {},
            allMonths: [],
            total: filteredData.length
        };

        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        // Coletar todos os meses possíveis do dataset original (sem filtros) para o seletor
        const monthsSet = new Set();
        data.forEach(item => {
            const date = new Date(item.created_at);
            const label = `${monthNames[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`;
            monthsSet.add(label);
        });
        stats.allMonths = Array.from(monthsSet).sort((a, b) => {
            // Sort logic: Dec/24 before Jan/25 etc.
            const [mA, yA] = a.split('/');
            const [mB, yB] = b.split('/');
            if (yA !== yB) return yA.localeCompare(yB);
            return monthNames.indexOf(mA) - monthNames.indexOf(mB);
        });

        filteredData.forEach(item => {
            // Categoria
            stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1;

            // Status
            if (item.status === 'donated' || item.collected_at) {
                stats.byStatus.donated++;
            } else {
                stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1;
            }

            // Mês (ex: Mar/24)
            const date = new Date(item.created_at);
            const monthLabel = `${monthNames[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`;
            stats.byMonth[monthLabel] = (stats.byMonth[monthLabel] || 0) + 1;
        });

        return stats;
    } catch (error) {
        console.error('[Database] Erro ao buscar estatísticas:', error.message);
        return null;
    }
};

export const getAppConfig = async (key) => {
    const { data, error } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', key)
        .single();

    if (error) {
        console.error('[getAppConfig] Erro:', error);
        return null;
    }
    return data.value;
};
