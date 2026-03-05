import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator, Alert, Modal, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/hooks/useAuth';
import { createDonation } from '@/services/databaseService';
import { supabase } from '@/config/supabase';

export default function NewDonationScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [description, setDescription] = useState('');
    const [ttl, setTtl] = useState('7');
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);

    const CATEGORIES = ['ALIMENTOS', 'VESTUÁRIO', 'MÓVEIS', 'BÍBLIAS/HINOS', 'OUTROS'];

    useEffect(() => { captureLocation(); }, []);

    const captureLocation = async () => {
        setLocationLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
        setLocationLoading(false);
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Permita o acesso à galeria de fotos.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão necessária', 'Permita o acesso à câmera.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const openPhotoOptions = () => {
        Alert.alert('Adicionar Foto', '', [
            { text: 'Câmera', onPress: takePhoto },
            { text: 'Galeria', onPress: pickImage },
            { text: 'Cancelar', style: 'cancel' },
        ]);
    };

    const uploadPhoto = async (uri: string): Promise<string | null> => {
        try {
            setPhotoUploading(true);
            const response = await fetch(uri);
            const blob = await response.blob();
            const filename = `donations/${Date.now()}.jpg`;
            const { error } = await supabase.storage
                .from('donation-images')
                .upload(filename, blob, { contentType: 'image/jpeg', upsert: true });
            if (error) { console.error('Upload error', error); return null; }
            const { data: { publicUrl } } = supabase.storage
                .from('donation-images')
                .getPublicUrl(filename);
            return publicUrl;
        } catch (e) {
            console.error('Upload failed', e);
            return null;
        } finally {
            setPhotoUploading(false);
        }
    };

    const handlePublish = async () => {
        if (!title || !category) {
            Alert.alert('Atenção', 'Preencha o título e a categoria.');
            return;
        }
        if (!user) return;
        setLoading(true);
        let image_url = null;
        if (photoUri) {
            image_url = await uploadPhoto(photoUri);
        }
        const expires = new Date();
        expires.setDate(expires.getDate() + parseInt(ttl));
        const result = await createDonation({
            title,
            category,
            description,
            ttl_days: parseInt(ttl),
            expires_at: expires.toISOString(),
            latitude: location?.latitude ?? null,
            longitude: location?.longitude ?? null,
            user_id: user.id,
            status: 'available',
            image_url,
        });
        setLoading(false);
        if (result.success) {
            Alert.alert('✅ Publicado!', 'Sua doação foi publicada com sucesso!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)/list') }
            ]);
        } else {
            Alert.alert('Erro', result.error ?? 'Não foi possível publicar.');
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialIcons name="arrow-back-ios" size={20} color="#003366" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Nova Doação</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* Steps Indicator */}
                    <View style={styles.stepsContainer}>
                        <View style={styles.stepActive}>
                            <View style={styles.stepActiveBar} />
                            <Text style={styles.stepActiveText}>FOTOS</Text>
                        </View>
                        <View style={styles.stepInactiveBar} />
                        <View style={styles.stepInactiveBar} />
                    </View>

                    {/* Photo Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitleCenter}>Adicionar Foto</Text>
                        <Text style={styles.sectionSubtitle}>Mostre para a irmandade o que você deseja doar!</Text>

                        <TouchableOpacity style={styles.photoUploadBox} activeOpacity={0.7} onPress={openPhotoOptions}>
                            {photoUri ? (
                                <>
                                    <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                                    <TouchableOpacity style={styles.removePhoto} onPress={() => setPhotoUri(null)}>
                                        <MaterialIcons name="close" size={16} color="#fff" />
                                    </TouchableOpacity>
                                    {photoUploading && (
                                        <View style={styles.uploadingOverlay}>
                                            <ActivityIndicator color="#fff" />
                                        </View>
                                    )}
                                </>
                            ) : (
                                <>
                                    <View style={styles.camIconWrapper}>
                                        <MaterialIcons name="add-a-photo" size={36} color="#fff" />
                                    </View>
                                    <Text style={styles.uploadTextBold}>Tire uma foto ou escolha da galeria</Text>
                                    <Text style={styles.uploadTextHelper}>Toque para adicionar</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Details Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="edit-note" size={24} color="#003366" />
                            <Text style={styles.sectionTitle}>Detalhes do Item</Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>TÍTULO</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: Cesta básica, Terno em bom estado"
                                placeholderTextColor="#94a3b8"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>CATEGORIA</Text>
                            <TouchableOpacity style={styles.input} onPress={() => setShowCategoryModal(true)}>
                                <Text style={{ color: category ? '#0f172a' : '#94a3b8', fontSize: 15 }}>
                                    {category || 'Selecione uma categoria'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>DESCRIÇÃO</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Descreva o item, estado de conservação e outras informações..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                textAlignVertical="top"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>
                    </View>

                    {/* Validity Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="history" size={24} color="#003366" />
                            <Text style={styles.sectionTitle}>Prazo de Validade</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ttlScroll}>
                            {['1 Dia', '3 Dias', '5 Dias', '7 Dias'].map((opt, idx) => {
                                const val = opt.split(' ')[0];
                                const isActive = ttl === val;
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.ttlBtn, isActive && styles.ttlBtnActive]}
                                        onPress={() => setTtl(val)}
                                    >
                                        <Text style={[styles.ttlBtnText, isActive && styles.ttlBtnTextActive]}>{opt}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Location Section */}
                    <View style={styles.locationBox}>
                        <View style={styles.locationInfo}>
                            <View style={styles.locationIconBox}>
                                <MaterialIcons name="location-on" size={24} color="#003366" />
                            </View>
                            <View>
                                <Text style={styles.locationLabel}>LOCAL DE COLETA</Text>
                                <Text style={styles.locationValue}>
                                    {locationLoading ? 'Obtendo localização...' : location ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Não obtido'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={captureLocation}>
                            {locationLoading
                                ? <ActivityIndicator color="#003366" />
                                : <MaterialIcons name="my-location" size={24} color="#003366" />}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={[styles.publishBtn, loading && { opacity: 0.7 }]} onPress={handlePublish} disabled={loading} activeOpacity={0.8}>
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <><Text style={styles.publishBtnText}>Publicar</Text>
                                <MaterialIcons name="check-circle" size={20} color="#fff" /></>}
                    </TouchableOpacity>

                    {/* Modal de categoria */}
                    <Modal visible={showCategoryModal} transparent animationType="slide">
                        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)} activeOpacity={1}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Selecione a Categoria</Text>
                                {['ALIMENTOS', 'VESTUÁRIO', 'MÓVEIS', 'BÍBLIAS/HINOS', 'OUTROS'].map((cat) => (
                                    <TouchableOpacity key={cat} style={styles.modalOption}
                                        onPress={() => { setCategory(cat); setShowCategoryModal(false); }}>
                                        <Text style={[styles.modalOptionText, category === cat && styles.modalOptionActive]}>{cat}</Text>
                                        {category === cat && <MaterialIcons name="check" size={18} color="#003366" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,51,102,0.1)',
        backgroundColor: '#fff',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,51,102,0.05)'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#003366',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    stepsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 32,
    },
    stepActive: {
        alignItems: 'center',
        gap: 8,
    },
    stepActiveBar: {
        height: 6,
        width: 48,
        backgroundColor: '#003366',
        borderRadius: 3,
    },
    stepActiveText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#003366',
        letterSpacing: 1,
    },
    stepInactiveBar: {
        height: 6,
        width: 48,
        backgroundColor: '#e2e8f0',
        borderRadius: 3,
        marginBottom: 18, // alignment adjustment
    },
    section: {
        marginBottom: 40,
    },
    sectionTitleCenter: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#003366',
        textAlign: 'center',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#475569',
        textAlign: 'center',
        marginBottom: 24,
    },
    photoUploadBox: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(0,51,102,0.2)',
        backgroundColor: 'rgba(0,51,102,0.02)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    camIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#003366',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#003366',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    uploadTextBold: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#003366',
    },
    uploadTextHelper: {
        fontSize: 12,
        color: '#94a3b8',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#003366',
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
        letterSpacing: 1,
        marginBottom: 6,
        marginLeft: 4,
    },
    input: {
        height: 52,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#0f172a',
    },
    pickerWrapper: {
        justifyContent: 'center',
    },
    pickerIcon: {
        position: 'absolute',
        right: 16,
    },
    textArea: {
        minHeight: 100,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        fontSize: 15,
        color: '#0f172a',
    },
    ttlScroll: {
        gap: 12,
        paddingBottom: 8,
    },
    ttlBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        backgroundColor: '#fff',
    },
    ttlBtnActive: {
        borderColor: '#003366',
        backgroundColor: '#003366',
    },
    ttlBtnText: {
        fontWeight: 'bold',
        color: '#64748b',
    },
    ttlBtnTextActive: {
        color: '#fff',
    },
    locationBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,51,102,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(0,51,102,0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 40,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    locationIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,51,102,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    locationValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#003366',
    },
    publishBtn: {
        flexDirection: 'row',
        height: 56,
        backgroundColor: '#003366',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#003366',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    publishBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        gap: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#003366',
        marginBottom: 12,
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalOptionText: {
        fontSize: 15,
        color: '#334155',
        fontWeight: '500',
    },
    modalOptionActive: {
        color: '#003366',
        fontWeight: 'bold',
    },
    photoPreview: {
        width: '100%',
        height: '100%',
        borderRadius: 22,
    },
    removePhoto: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 12,
        padding: 4,
    },
    uploadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
