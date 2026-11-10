import { createWarehouse, getWarehouses, updateWarehouse } from '@/services/databaseService';
import { geocodePublicWarehouse, type WarehouseGeocodeCandidate } from '@/utils/warehouseGeocoding';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminWarehouses() {
    const router = useRouter();
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    // Form state
    const [editId, setEditId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [geocoding, setGeocoding] = useState(false);
    const [geocodeResults, setGeocodeResults] = useState<WarehouseGeocodeCandidate[]>([]);
    const [confirmedLocation, setConfirmedLocation] = useState<WarehouseGeocodeCandidate | null>(null);
    const [originalAddress, setOriginalAddress] = useState('');
    // Gate temporário: nenhuma coordenada escrita antes de backup recuperável.
    // A flag só habilita o fluxo visual; políticas RLS devem autorizar a gravação.
    const geocodingSaveEnabled = process.env.EXPO_PUBLIC_ENABLE_WAREHOUSE_GEOCODING_SAVE === 'true';

    const searchLocation = async () => {
        if (geocoding || submitting) return;
        setGeocoding(true);
        setConfirmedLocation(null);
        setGeocodeResults([]);
        try {
            const candidates = await geocodePublicWarehouse(address);
            setGeocodeResults(candidates);
            if (!candidates.length) {
                Alert.alert('Localização não encontrada', 'Confira o endereço ou verifique o ponto manualmente no mapa.');
            }
        } catch (error) {
            Alert.alert('Busca indisponível', error instanceof Error ? error.message : 'Não foi possível localizar o endereço.');
        } finally {
            setGeocoding(false);
        }
    };

    const openLocationPreview = (candidate: WarehouseGeocodeCandidate) => {
        // Link público para conferência visual. Não inclui endereço residencial.
        const url = `https://www.openstreetmap.org/?mlat=${candidate.latitude}&mlon=${candidate.longitude}#map=17/${candidate.latitude}/${candidate.longitude}`;
        Linking.openURL(url);
    };

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        setLoading(true);
        const data = await getWarehouses(true); // Include inactive
        setWarehouses(data);
        setLoading(false);
    };

    const handleSave = async () => {
        if (!name.trim() || !address.trim()) {
            Alert.alert('Erro', 'Preencha todos os campos.');
            return;
        }

        if (confirmedLocation && !geocodingSaveEnabled) {
            Alert.alert('Gravação de coordenadas bloqueada', 'A localização foi pesquisada, mas só poderá ser salva após aprovação do backup completo do Supabase.');
            return;
        }
        if (editId && address.trim() !== originalAddress.trim() && !confirmedLocation && geocodingSaveEnabled) {
            Alert.alert('Confirme o novo local', 'O endereço mudou. Pesquise e confirme uma localização antes de salvar, para não manter coordenadas antigas.');
            return;
        }

        const coordinates = confirmedLocation && geocodingSaveEnabled
            ? { latitude: confirmedLocation.latitude, longitude: confirmedLocation.longitude }
            : {};
        setSubmitting(true);
        let res;
        if (editId) {
            res = await updateWarehouse(editId, { name, address, ...coordinates });
        } else {
            res = await createWarehouse({ name, address, is_active: true, ...coordinates });
        }
        setSubmitting(false);

        if (res.success) {
            setModalVisible(false);
            resetForm();
            load();
        } else {
            Alert.alert('Erro', 'Não foi possível salvar o galpão.');
        }
    };

    const resetForm = () => {
        setEditId(null);
        setName('');
        setAddress('');
        setOriginalAddress('');
        setGeocodeResults([]);
        setConfirmedLocation(null);
    };

    const handleToggleActive = async (item: any) => {
        const res = await updateWarehouse(item.id, { is_active: !item.is_active });
        if (res.success) load();
    };

    const renderWarehouse = ({ item }: { item: any }) => (
        <View style={[styles.card, !item.is_active && styles.cardInactive]}>
            <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, !item.is_active && styles.textMuted]}>{item.name}</Text>
                <Text style={[styles.cardAddress, !item.is_active && styles.textMuted]}>{item.address}</Text>
            </View>
            <View style={styles.cardActions}>
                <Switch
                    value={item.is_active}
                    onValueChange={() => handleToggleActive(item)}
                    trackColor={{ false: '#cbd5e1', true: '#003366' }}
                />
                <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => {
                        setEditId(item.id);
                        setName(item.name);
                        setAddress(item.address);
                        setOriginalAddress(item.address);
                        setGeocodeResults([]);
                        setConfirmedLocation(null);
                        setModalVisible(true);
                    }}
                >
                    <MaterialIcons name="edit" size={20} color="#64748b" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={24} color="#003366" />
                </TouchableOpacity>
                <View>
                    <Text style={styles.headerTitle}>Gestão de Galpões</Text>
                    <Text style={styles.headerSub}>Almoxarifados e pontos de estocagem</Text>
                </View>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color="#003366" style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={warehouses}
                    keyExtractor={(item) => item.id}
                    renderItem={renderWarehouse}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>Nenhum galpão cadastrado.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => {
                    resetForm();
                    setModalVisible(true);
                }}
            >
                <MaterialIcons name="add" size={28} color="#fff" />
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editId ? 'Editar Galpão' : 'Novo Galpão'}</Text>

                        <Text style={styles.label}>Nome do Local</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Almoxarifado Central"
                            value={name}
                            onChangeText={setName}
                        />

                        <Text style={styles.label}>Endereço Completo</Text>
                        <TextInput
                            style={[styles.input, { height: 80 }]}
                            placeholder="Rua, número, bairro..."
                            multiline
                            value={address}
                            onChangeText={(value) => {
                                setAddress(value);
                                setConfirmedLocation(null);
                                setGeocodeResults([]);
                            }}
                        />

                        <TouchableOpacity
                            style={styles.geocodeButton}
                            accessibilityRole="button"
                            disabled={geocoding || address.trim().length < 10}
                            onPress={searchLocation}
                        >
                            {geocoding ? <ActivityIndicator color="#003366" /> :
                                <MaterialIcons name="place" size={20} color="#003366" />}
                            <Text style={styles.geocodeButtonText}>
                                {geocoding ? 'Pesquisando posição...' : 'Buscar posição pelo endereço'}
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.geocodeHelp}>
                            Sugestões do OpenStreetMap/Photon. Verifique o ponto antes de confirmar.
                            Esta consulta é feita apenas quando você solicita.
                        </Text>
                        {geocodeResults.length > 0 && (
                            <ScrollView style={styles.geocodeList} nestedScrollEnabled>
                                {geocodeResults.map((candidate, index) => (
                                    <View key={`${candidate.latitude}-${candidate.longitude}-${index}`} style={styles.geocodeResult}>
                                        <TouchableOpacity
                                            accessibilityRole="button"
                                            accessibilityLabel={`Selecionar localização ${candidate.label}`}
                                            onPress={() => setConfirmedLocation(candidate)}
                                            style={styles.geocodeChoice}
                                        >
                                            <MaterialIcons
                                                name={confirmedLocation === candidate ? 'radio-button-checked' : 'radio-button-unchecked'}
                                                size={20}
                                                color="#003366"
                                            />
                                            <Text style={styles.geocodeLabel}>{candidate.label}</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            accessibilityRole="link"
                                            accessibilityLabel="Conferir posição no OpenStreetMap"
                                            onPress={() => openLocationPreview(candidate)}
                                            style={styles.mapLink}
                                        >
                                            <MaterialIcons name="open-in-new" size={18} color="#003366" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                        {confirmedLocation && (
                            <Text style={styles.locationConfirm}>
                                Posição selecionada: {confirmedLocation.latitude.toFixed(6)}, {confirmedLocation.longitude.toFixed(6)}
                            </Text>
                        )}
                        {!geocodingSaveEnabled && (
                            <Text style={styles.geocodeGate}>
                                Homologação: a gravação de coordenadas está bloqueada até a validação do backup do banco.
                            </Text>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.saveBtn}
                                onPress={handleSave}
                                disabled={submitting}
                            >
                                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Salvar</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    backBtn: { marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#003366' },
    headerSub: { fontSize: 12, color: '#64748b' },

    list: { padding: 16 },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4
    },
    cardInactive: { backgroundColor: '#f1f5f9', borderStyle: 'dotted', borderWidth: 1, borderColor: '#cbd5e1' },
    cardInfo: { flex: 1 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
    cardAddress: { fontSize: 13, color: '#64748b', marginTop: 4 },
    textMuted: { color: '#94a3b8' },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    editBtn: { padding: 8 },

    fab: {
        position: 'absolute', bottom: 30, right: 30,
        width: 60, height: 60, borderRadius: 30,
        backgroundColor: '#003366', alignItems: 'center', justifyContent: 'center',
        elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6
    },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalScroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 16 },
    modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
    geocodeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderColor: '#93c5fd', borderWidth: 1, borderRadius: 10, padding: 12, backgroundColor: '#eff6ff', marginTop: 12 },
    geocodeButtonText: { color: '#003366', fontWeight: '700' },
    geocodeHelp: { fontSize: 12, color: '#64748b', marginTop: 8 },
    geocodeList: { maxHeight: 200, marginTop: 10 },
    geocodeResult: { flexDirection: 'row', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 8, marginBottom: 6, alignItems: 'center' },
    geocodeChoice: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
    geocodeLabel: { flex: 1, fontSize: 12, color: '#0f172a' },
    mapLink: { padding: 10 },
    locationConfirm: { fontSize: 12, color: '#065f46', marginTop: 8 },
    geocodeGate: { fontSize: 12, color: '#92400e', marginTop: 8, marginBottom: 4 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#003366', marginBottom: 20 },
    label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 8 },
    input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 15 },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 10 },
    cancelBtn: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    cancelBtnText: { color: '#64748b', fontWeight: 'bold' },
    saveBtn: { flex: 1, height: 50, backgroundColor: '#003366', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { color: '#fff', fontWeight: 'bold' },

    empty: { alignItems: 'center', marginTop: 100 },
    emptyText: { color: '#94a3b8' }
});
