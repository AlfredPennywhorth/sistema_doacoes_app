import { supabase } from '../config/supabase';

// ─── Itens / Doações ────────────────────────────────────────────────────────

export const getDonations = async (category = null) => {
    let query = supabase
        .from('items')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });

    if (category && category !== 'TODOS') {
        query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) { console.error('Erro ao buscar doações', error); return []; }
    return data;
};

export const getDonationById = async (id) => {
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();
    if (error) { console.error('Erro ao buscar doação', error); return null; }
    return data;
};

export const createDonation = async (donationData) => {
    const { data, error } = await supabase
        .from('items')
        .insert([donationData])
        .select()
        .single();
    if (error) return { success: false, error: error.message };
    return { success: true, data };
};

// ─── Reserva atômica ────────────────────────────────────────────────────────

export const requestItemWithLock = async (itemId, userId) => {
    const { data, error } = await supabase
        .from('items')
        .update({ status: 'reserved', requested_by: userId, reserved_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('status', 'available')
        .select();

    if (error) return { success: false, message: 'Erro ao tentar reservar item.' };
    if (!data || data.length === 0) return { success: false, message: 'Item esgotou recentemente.' };
    return { success: true, message: 'Item reservado com sucesso!', data: data[0] };
};

// ─── Legado ─────────────────────────────────────────────────────────────────

export const getAvailableItems = getDonations;

export const registerNeed = async (needData) => {
    const { data, error } = await supabase
        .from('needs')
        .insert([{ ...needData, created_at: new Date().toISOString() }]);
    if (error) return { success: false, error };
    return { success: true, data };
};
