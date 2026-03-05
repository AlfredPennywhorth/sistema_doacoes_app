import { createWarehouse, getWarehouses, updateWarehouse } from '@/services/databaseService';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Modal,
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

        setSubmitting(true);
        let res;
        if (editId) {
            res = await updateWarehouse(editId, { name, address });
        } else {
            res = await createWarehouse({ name, address, is_active: true });
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
                            onChangeText={setAddress}
                        />

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
    modalContent: { backgroundColor: '#fff', borderRadius: 24, padding: 24 },
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
