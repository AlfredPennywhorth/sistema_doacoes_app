import { supabase } from '../config/supabase';

/**
 * Service to handle transactions and generic CRUD operations with Supabase.
 * In a real-world app, you might want to wrap these functions with error handling,
 * logging, and typing.
 */

export const getAvailableItems = async () => {
    const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('status', 'available');

    if (error) {
        console.error('Error fetching available items', error);
        return [];
    }
    return data;
};

// Atomic lock implementation equivalent using Postgres Update
export const requestItemWithLock = async (itemId, userId) => {
    // We use Postgres' atomic UPDATE where status = 'available'
    const { data, error, count } = await supabase
        .from('items')
        .update({ status: 'reserved', requested_by: userId, reserved_at: new Date().toISOString() })
        .eq('id', itemId)
        .eq('status', 'available') // crucial for atomic lock
        .select();

    if (error) {
        console.error('Transaction failed', error);
        return { success: false, message: 'Erro ao tentar reservar item.' };
    }

    // If no rows updated, someone else already took it or it's not available
    if (!data || data.length === 0) {
        return { success: false, message: 'Item esgotou recentemente. Não foi possível reservar.' };
    }

    return { success: true, message: 'Item reservado com sucesso!', data: data[0] };
};

export const registerNeed = async (needData) => {
    const { data, error } = await supabase
        .from('needs')
        .insert([{ ...needData, created_at: new Date().toISOString() }]);

    if (error) return { success: false, error };
    return { success: true, data };
};
