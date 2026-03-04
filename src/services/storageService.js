import { supabase } from '../config/supabase';
import * as ImagePicker from 'expo-image-picker';

export const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5, // Compression optimization
    });

    if (!result.canceled) {
        return result.assets[0].uri;
    }
    return null;
};

export const uploadImage = async (uri, fileName) => {
    try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const { data, error } = await supabase.storage
            .from('donations')
            .upload(`images/${fileName}`, blob, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: publicData } = supabase.storage
            .from('donations')
            .getPublicUrl(data.path);

        return publicData.publicUrl;
    } catch (error) {
        console.error('Upload failed:', error.message);
        return null; // ou throw error
    }
};
