import { supabase } from '../config/supabase';

// ─── Itens / Doações ────────────────────────────────────────────────────────

export const getDonations = async (category = null, warehouseId = null, includeReserved = false) => {
    let query = supabase
        .from('items')
        .select(`
            *,
            donor:profiles!user_id(name, phone),
            warehouse:warehouses(name, address)
        `);

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
        .select(`
            *,
            donor:profiles!user_id(name, phone),
            warehouse:warehouses(name, address)
        `)
        .eq('id', id);

    if (error) {
        console.error('[getDonationById] Erro na query:', error);
        return null;
    }

    if (!data || data.length === 0) return null;
    return data[0];
};

export const createDonation = async (itemData) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Não autenticado' };

    const { data, error } = await supabase
        .from('items')
        .insert([{
            ...itemData,
            user_id: user.id,
            status: 'available'
        }])
        .select();

    if (error) { console.error('Erro ao criar doação', error); return { error: error.message }; }
    return { success: true, data: data[0] };
};

export const confirmItemCollection = async (itemId) => {
    const { data, error } = await supabase
        .from('items')
        .update({
            status: 'donated',
            collected_at: new Date().toISOString()
        })
        .eq('id', itemId)
        .select();

    if (error) {
        console.error('[confirmItemCollection] Erro:', error);
        return { success: false, message: error.message };
    }
    return { success: true, data: data[0] };
};

export const deleteItem = async (itemId) => {
    const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

    if (error) {
        console.error('[deleteItem] Erro:', error);
        return { success: false, message: error.message };
    }
    return { success: true };
};

// ─── Minhas Reservas (Requerente) ──────────────────────────────────────────

export const getMyReservations = async (userId) => {
    const { data, error } = await supabase
        .from('items')
        .select(`
            *,
            donor:profiles!user_id(name, phone),
            warehouse:warehouses(name, address)
        `)
        .eq('requested_by', userId)
        .eq('status', 'reserved')
        .order('reserved_at', { ascending: false });

    if (error) {
        console.error('[getMyReservations] Erro:', error);
        return [];
    }
    return data;
};

// ─── Minhas Doações (Doador) ──────────────────────────────────────────────

export const getMyDonations = async (userId) => {
    const { data, error } = await supabase
        .from('items')
        .select(`
            *,
            requester:profiles!requested_by(name, phone),
            warehouse:warehouses(name, address)
        `)
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
    // 1. Volta o item para disponível
    const { error: itemErr } = await supabase
        .from('items')
        .update({
            status: 'available',
            requested_by: null,
            reserved_at: null
        })
        .eq('id', itemId);

    if (itemErr) return { success: false, message: itemErr.message };

    // 2. Se houver um pedido associado, reabre o pedido
    if (requestId) {
        await supabase
            .from('item_requests')
            .update({ status: 'open' })
            .eq('id', requestId);
    }

    return { success: true, message: 'Item liberado com sucesso.' };
};

export const requestItemWithLock = async (itemId, userId) => {
    const { data: current, error: fetchErr } = await supabase
        .from('items')
        .select('id, status')
        .eq('id', itemId)
        .single();

    if (fetchErr) return { success: false, message: 'Erro ao verificar o item.' };
    if (!current || current.status !== 'available') {
        return { success: false, message: 'Este item não está mais disponível.' };
    }

    const { data, error } = await supabase
        .from('items')
        .update({
            status: 'reserved',
            requested_by: userId,
            reserved_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .eq('status', 'available')
        .select();

    if (error) return { success: false, message: `Erro ao reservar: ${error.message}` };
    if (!data || data.length === 0) {
        return { success: false, message: 'Item foi reservado por outra pessoa agora mesmo.' };
    }
    return { success: true, message: 'Item reservado com sucesso!', data: data[0] };
};

// ─── Item Requests (Pedidos) ────────────────────────────────────────────────

export const getItemRequests = async (category = 'TODOS') => {
    try {
        let query = supabase
            .from('item_requests')
            .select(`
                *,
                requester:profiles!user_id(name, phone)
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
        .select('*');

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
        .select('*')
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
            .select('*');

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
