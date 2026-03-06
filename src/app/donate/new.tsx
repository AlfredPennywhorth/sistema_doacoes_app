import { supabase } from '@/config/supabase';
import { useAuth } from '@/hooks/useAuth';
import { createDonation, fulfillItemRequest, getItemRequests, getWarehouses } from '@/services/databaseService';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewDonationScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [description, setDescription] = useState('');
    const [ttl, setTtl] = useState('7');
    const [isUrgent, setIsUrgent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [photoUploading, setPhotoUploading] = useState(false);

    // Pickup details
    const [pickupAddress, setPickupAddress] = useState('');
    const [pickupInstructions, setPickupInstructions] = useState('');

    // Warehouse state
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [selectedWarehouseId, setSelectedWarehouseId] = useState<string | null>(null);
    const [useWarehouse, setUseWarehouse] = useState(false);
    const [showWarehouseModal, setShowWarehouseModal] = useState(false);

    // Matchmaking state
    const [matches, setMatches] = useState<any[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [showMatchModal, setShowMatchModal] = useState(false);

    const CATEGORIES = ['ALIMENTOS', 'ITENS HOSPITALARES', 'LINHA BRANCA', 'MÓVEIS', 'ÓRGÃO ELETRÔNICO', 'VESTUÁRIO', 'OUTROS'];

    useEffect(() => {
        captureLocation();
        loadWarehouses();
    }, []);

    const loadWarehouses = async () => {
        const data = await getWarehouses();
        setWarehouses(data);
    };

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
            const filename = `donations/${Date.now()}.jpg`;

            const formData = new FormData();
            formData.append('file', {
                uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
                type: 'image/jpeg',
                name: 'upload.jpg',
            } as any);

            const { data, error } = await supabase.storage
                .from('donation-images')
                .upload(filename, formData, {
                    contentType: 'image/jpeg',
                    upsert: true
                });

            if (error) {
                console.error('[Upload] Erro Supabase:', error);
                return null;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('donation-images')
                .getPublicUrl(filename);

            return publicUrl;
        } catch (e) {
            console.error('[Upload] Falha geral:', e);
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
            warehouse_id: useWarehouse ? selectedWarehouseId : null,
            status: selectedRequest ? 'reserved' : 'available',
            requested_by: selectedRequest ? selectedRequest.user_id : null,
            reserved_at: selectedRequest ? new Date().toISOString() : null,
            image_url,
            is_urgent: isUrgent,
            pickup_address: pickupAddress,
            pickup_instructions: pickupInstructions,
        });
        setLoading(false);
        if (result.success) {
            // Se foi através de um match, desativa o pedido
            if (selectedRequest) {
                await fulfillItemRequest(selectedRequest.id);
            }

            Alert.alert(
                'Parabéns',
                selectedRequest
                    ? `Item reservado para ${selectedRequest.requester?.name}. O interessado avaliará a distância e entrará em contato.`
                    : 'Sua doação foi publicada com sucesso!',
                [{ text: 'OK', onPress: () => router.replace('/(tabs)/list') }]
            );
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

                        {/* Campo de Urgência */}
                        <TouchableOpacity
                            style={styles.urgencyContainer}
                            onPress={() => setIsUrgent(!isUrgent)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.urgencyToggle, isUrgent && styles.urgencyToggleActive]}>
                                <MaterialIcons
                                    name={isUrgent ? "priority-high" : "low-priority"}
                                    size={20}
                                    color={isUrgent ? "#fff" : "#64748b"}
                                />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.urgencyLabel}>RETIRADA URGENTE?</Text>
                                <Text style={styles.urgencySublabel}>Marque se o item precisa ser coletado o quanto antes.</Text>
                            </View>
                            <View style={[styles.switchTrack, isUrgent && styles.switchTrackActive]}>
                                <View style={[styles.switchThumb, isUrgent && styles.switchThumbActive]} />
                            </View>
                        </TouchableOpacity>
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

                    {/* Warehouse Selection */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="inventory" size={24} color="#003366" />
                            <Text style={styles.sectionTitle}>Local do Item</Text>
                        </View>

                        <View style={styles.locationSelectors}>
                            <TouchableOpacity
                                style={[styles.locationTypeBtn, !useWarehouse && styles.locationTypeBtnActive]}
                                onPress={() => setUseWarehouse(false)}
                            >
                                <MaterialIcons name="home" size={20} color={!useWarehouse ? "#fff" : "#64748b"} />
                                <Text style={[styles.locationTypeText, !useWarehouse && styles.locationTypeTextActive]}>Minha Casa</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.locationTypeBtn, useWarehouse && styles.locationTypeBtnActive]}
                                onPress={() => setUseWarehouse(true)}
                            >
                                <MaterialIcons name="warehouse" size={20} color={useWarehouse ? "#fff" : "#64748b"} />
                                <Text style={[styles.locationTypeText, useWarehouse && styles.locationTypeTextActive]}>Galpão</Text>
                            </TouchableOpacity>
                        </View>

                        {useWarehouse ? (
                            <TouchableOpacity
                                style={styles.warehousePicker}
                                onPress={() => setShowWarehouseModal(true)}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.warehouseName}>
                                        {warehouses.find(w => w.id === selectedWarehouseId)?.name || 'Selecionar Galpão'}
                                    </Text>
                                    <Text style={styles.warehouseAddr}>
                                        {warehouses.find(w => w.id === selectedWarehouseId)?.address || 'Toque para escolher'}
                                    </Text>
                                </View>
                                <MaterialIcons name="arrow-drop-down" size={24} color="#003366" />
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.locationBoxSmall}>
                                <View style={styles.locationInfo}>
                                    <View style={styles.locationIconBox}>
                                        <MaterialIcons name="location-on" size={20} color="#003366" />
                                    </View>
                                    <View>
                                        <Text style={styles.locationLabel}>COLETAR NO MEU ENDEREÇO</Text>
                                        <Text style={styles.locationValue}>
                                            {locationLoading ? 'Obtendo GPS...' : location ? 'Coordenadas obtidas' : 'Não obtido'}
                                        </Text>
                                    </View>
                                </View>
                                <TouchableOpacity onPress={captureLocation}>
                                    <MaterialIcons name="my-location" size={20} color="#003366" />
                                </TouchableOpacity>
                            </View>
                        )}

                        <View style={[styles.formGroup, { marginTop: 16 }]}>
                            <Text style={styles.label}>ENDEREÇO EXATO DE RETIRADA</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Rua, número, bairro, apto, etc."
                                placeholderTextColor="#94a3b8"
                                value={pickupAddress}
                                onChangeText={setPickupAddress}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>HORÁRIOS E INSTRUÇÕES DE ACESSO</Text>
                            <TextInput
                                style={styles.textAreaSmall}
                                placeholder="Ex: Retirar entre 14h e 18h. Portaria 2, falar com porteiro..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                value={pickupInstructions}
                                onChangeText={setPickupInstructions}
                            />
                        </View>
                    </View>

                    <TouchableOpacity style={[styles.publishBtn, loading && { opacity: 0.7 }]} onPress={handlePublish} disabled={loading} activeOpacity={0.8}>
                        {loading
                            ? <ActivityIndicator color="#fff" />
                            : <><Text style={styles.publishBtnText}>Publicar</Text>
                                <MaterialIcons name="check-circle" size={20} color="#fff" /></>}
                    </TouchableOpacity>

                    {/* Modal de Categoria */}
                    <Modal visible={showCategoryModal} transparent animationType="slide">
                        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)} activeOpacity={1}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Selecione a Categoria</Text>
                                {CATEGORIES.map((cat) => (
                                    <TouchableOpacity key={cat} style={styles.modalOption}
                                        onPress={async () => {
                                            setCategory(cat);
                                            if (cat === 'ALIMENTOS') setIsUrgent(true);
                                            setShowCategoryModal(false);

                                            const reqs = await getItemRequests(cat);
                                            if (reqs.length > 0) {
                                                setMatches(reqs);
                                                setSelectedRequest(reqs[0]);
                                                setShowMatchModal(true);
                                            }
                                        }}>
                                        <Text style={[styles.modalOptionText, category === cat && styles.modalOptionActive]}>{cat}</Text>
                                        {category === cat && <MaterialIcons name="check" size={18} color="#003366" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    {/* Modal de Galpões */}
                    <Modal visible={showWarehouseModal} transparent animationType="slide">
                        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowWarehouseModal(false)} activeOpacity={1}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Selecione o Galpão</Text>
                                {warehouses.map((w) => (
                                    <TouchableOpacity key={w.id} style={styles.modalOption}
                                        onPress={() => {
                                            setSelectedWarehouseId(w.id);
                                            setPickupAddress(w.address); // Auto-fill address
                                            setShowWarehouseModal(false);
                                        }}>
                                        <View>
                                            <Text style={[styles.modalOptionText, selectedWarehouseId === w.id && styles.modalOptionActive]}>{w.name}</Text>
                                            <Text style={styles.warehouseAddrSmall}>{w.address}</Text>
                                        </View>
                                        {selectedWarehouseId === w.id && <MaterialIcons name="check" size={18} color="#003366" />}
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableOpacity>
                    </Modal>

                    {/* Modal de Matchmaking */}
                    <Modal visible={showMatchModal} transparent animationType="slide">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Alguém precisa disso! 🤝</Text>
                                <Text style={styles.modalSubtitle}>Encontramos irmãos que estão precisando de itens desta categoria. Deseja doar diretamente para um deles?</Text>

                                <ScrollView style={{ maxHeight: 300 }}>
                                    {matches.map((req) => (
                                        <View
                                            key={req.id}
                                            style={[styles.matchItem, selectedRequest?.id === req.id && styles.matchItemActive]}
                                        >
                                            <View style={styles.matchInfo}>
                                                <Text style={styles.matchTitle}>{req.title}</Text>
                                                <Text style={styles.matchUser}>Pedido por: {req.requester?.name || 'Comunidade'}</Text>
                                                <Text style={styles.matchHint}>Dica: Após reservar, o interessado verá sua localização e poderá entrar em contato.</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.matchButton}
                                                onPress={() => setSelectedRequest(req)}
                                            >
                                                <MaterialIcons
                                                    name={selectedRequest?.id === req.id ? "check-circle" : "radio-button-unchecked"}
                                                    size={24}
                                                    color={selectedRequest?.id === req.id ? "#003366" : "#cbd5e1"}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>

                                <View style={styles.matchFooter}>
                                    <TouchableOpacity
                                        style={[styles.confirmMatchBtn, !selectedRequest && styles.disabledBtn]}
                                        disabled={!selectedRequest}
                                        onPress={() => setShowMatchModal(false)}
                                    >
                                        <Text style={styles.confirmMatchText}>Reservar para este Pedido</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => { setSelectedRequest(null); setShowMatchModal(false); }}>
                                        <Text style={styles.skipMatchText}>Postar na Vitrine Geral</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                </ScrollView>
            </KeyboardAvoidingView >
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,51,102,0.1)', backgroundColor: '#fff' },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,51,102,0.05)' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#003366' },
    scrollContent: { padding: 24, paddingBottom: 40 },
    stepsContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 32 },
    stepActive: { alignItems: 'center', gap: 8 },
    stepActiveBar: { height: 6, width: 48, backgroundColor: '#003366', borderRadius: 3 },
    stepActiveText: { fontSize: 10, fontWeight: 'bold', color: '#003366', letterSpacing: 1 },
    stepInactiveBar: { height: 6, width: 48, backgroundColor: '#e2e8f0', borderRadius: 3, marginBottom: 18 },
    section: { marginBottom: 40 },
    sectionTitleCenter: { fontSize: 24, fontWeight: 'bold', color: '#003366', textAlign: 'center', marginBottom: 8 },
    sectionSubtitle: { fontSize: 14, color: '#475569', textAlign: 'center', marginBottom: 24 },
    photoUploadBox: { width: '100%', aspectRatio: 1, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(0,51,102,0.2)', backgroundColor: 'rgba(0,51,102,0.02)', alignItems: 'center', justifyContent: 'center', gap: 16 },
    camIconWrapper: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#003366', alignItems: 'center', justifyContent: 'center', shadowColor: '#003366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    uploadTextBold: { fontSize: 14, fontWeight: 'bold', color: '#003366' },
    uploadTextHelper: { fontSize: 12, color: '#94a3b8' },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#003366' },
    formGroup: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: 'bold', color: '#64748b', letterSpacing: 1, marginBottom: 6, marginLeft: 4 },
    input: { height: 52, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, fontSize: 15, color: '#0f172a' },
    textArea: { minHeight: 100, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 15, color: '#0f172a' },
    textAreaSmall: { minHeight: 70, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, fontSize: 14, color: '#0f172a' },
    ttlScroll: { gap: 12, paddingBottom: 8 },
    ttlBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, borderWidth: 2, borderColor: '#e2e8f0', backgroundColor: '#fff' },
    ttlBtnActive: { borderColor: '#003366', backgroundColor: '#003366' },
    ttlBtnText: { fontWeight: 'bold', color: '#64748b' },
    ttlBtnTextActive: { color: '#fff' },
    publishBtn: { flexDirection: 'row', height: 56, backgroundColor: '#003366', borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8, shadowColor: '#003366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
    publishBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 8 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#003366', marginBottom: 12 },
    modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    modalOptionText: { fontSize: 15, color: '#334155', fontWeight: '500' },
    modalOptionActive: { color: '#003366', fontWeight: 'bold' },
    urgencyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, marginTop: 8, gap: 12 },
    urgencyToggle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
    urgencyToggleActive: { backgroundColor: '#dc2626' },
    urgencyLabel: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
    urgencySublabel: { fontSize: 11, color: '#64748b' },
    switchTrack: { width: 44, height: 24, borderRadius: 12, backgroundColor: '#e2e8f0', padding: 2 },
    switchTrackActive: { backgroundColor: '#dc2626' },
    switchThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
    switchThumbActive: { transform: [{ translateX: 20 }] },
    photoPreview: { width: '100%', height: '100%', borderRadius: 22 },
    removePhoto: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12, padding: 4 },
    uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    locationSelectors: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    locationTypeBtn: { flex: 1, height: 48, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff' },
    locationTypeBtnActive: { backgroundColor: '#003366', borderColor: '#003366' },
    locationTypeText: { fontSize: 13, fontWeight: 'bold', color: '#64748b' },
    locationTypeTextActive: { color: '#fff' },
    warehousePicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    warehouseName: { fontSize: 16, fontWeight: 'bold', color: '#003366' },
    warehouseAddr: { fontSize: 13, color: '#64748b', marginTop: 2 },
    locationBoxSmall: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    locationIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,51,102,0.1)', alignItems: 'center', justifyContent: 'center' },
    locationLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
    locationValue: { fontSize: 14, fontWeight: '600', color: '#003366' },
    warehouseAddrSmall: { fontSize: 11, color: '#94a3b8' },
    modalSubtitle: { fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 18 },
    matchItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, backgroundColor: '#f8fafc' },
    matchItemActive: { borderColor: '#003366', backgroundColor: 'rgba(0,51,102,0.05)', borderWidth: 2 },
    matchInfo: { flex: 1 },
    matchTitle: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
    matchUser: { fontSize: 13, color: '#64748b', marginTop: 2 },
    matchHint: { fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 4 },
    matchButton: { padding: 10 },
    matchFooter: { marginTop: 16, gap: 12 },
    confirmMatchBtn: { height: 50, backgroundColor: '#059669', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    disabledBtn: { opacity: 0.5 },
    confirmMatchText: { color: '#fff', fontWeight: 'bold' },
    skipMatchText: { color: '#64748b', fontWeight: '600', textAlign: 'center' },
    matchCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12, backgroundColor: '#f8fafc' },
    matchCardActive: { borderColor: '#059669', backgroundColor: '#ecfdf5', borderWidth: 2 },
    matchName: { fontSize: 13, fontWeight: 'bold', color: '#003366', marginBottom: 2 },
    matchDesc: { fontSize: 12, color: '#64748b' },
    matchActions: { marginTop: 16, gap: 12 },
    matchConfirmBtn: { height: 50, backgroundColor: '#059669', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    matchConfirmText: { color: '#fff', fontWeight: 'bold' },
    matchSkipBtn: { height: 40, alignItems: 'center', justifyContent: 'center' },
    matchSkipText: { color: '#64748b', fontWeight: '600' },
});
