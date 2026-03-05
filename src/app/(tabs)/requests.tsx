import { useAuth } from '@/hooks/useAuth';
import { confirmItemCollection, createItemRequest, getItemRequests, getMyDonations, getMyReservations, releaseItem } from '@/services/databaseService';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CATEGORIES = ['ALIMENTOS', 'ITENS HOSPITALARES', 'LINHA BRANCA', 'MÓVEIS', 'ÓRGÃO ELETRÔNICO', 'VESTUÁRIO', 'OUTROS'];

export default function RequestsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [requests, setRequests] = useState<any[]>([]);
    const [myReservations, setMyReservations] = useState<any[]>([]);
    const [myDonations, setMyDonations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Form state
    const [category, setCategory] = useState('OUTROS');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [reqs, resvs, dons] = await Promise.all([
                getItemRequests(),
                getMyReservations(user.id),
                getMyDonations(user.id)
            ]);
            setRequests(reqs);
            setMyReservations(resvs);
            setMyDonations(dons);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        load();
    }, [load]);

    const onRefresh = async () => {
        setRefreshing(true);
        await load();
        setRefreshing(false);
    };

    const handleCreateRequest = async () => {
        if (!user) return;
        if (!title.trim()) return;

        setSubmitting(true);
        const result = await createItemRequest({
            user_id: user.id,
            category,
            title,
            description,
            status: 'open'
        });
        setSubmitting(false);

        if (result.success) {
            setModalVisible(false);
            setTitle('');
            setDescription('');
            load();
        }
    };

    const handleRelease = (item: any) => {
        Alert.alert(
            'Recusar Item',
            'Tem certeza que deseja recusar este item? Ele voltará para a vitrine e ficará disponível para outras pessoas.',
            [
                { text: 'Não, manter', style: 'cancel' },
                {
                    text: 'Sim, recursar',
                    style: 'destructive',
                    onPress: async () => {
                        const res = await releaseItem(item.id);
                        if (res.success) load();
                    }
                }
            ]
        );
    };

    const handleConfirmWhatsApp = (item: any) => {
        const phone = item.donor?.phone || '';
        const donorName = item.donor?.name ? `\n${item.donor.name}` : '';
        let message = `A paz de Deus,${donorName}\n\nReservei seu item "${item.title}" no app de doações e gostaria de agendar a retirada.\n`;

        if (item.pickup_address) {
            message += `\nLocal informado: ${item.pickup_address}`;
        }
        if (item.pickup_instructions) {
            message += `\nInstruções: ${item.pickup_instructions}`;
        }

        message += `\n\nSaudações`;

        const url = `whatsapp://send?phone=55${phone.replace(/\D/g, '')}&text=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert('Erro', 'WhatsApp não instalado.');
            }
        });
    };

    const handleConfirmCollectionManual = async (itemId: string) => {
        Alert.alert(
            'Confirmar Retirada',
            'O item foi retirado? Isso concluirá a doação.',
            [
                { text: 'Não', style: 'cancel' },
                {
                    text: 'Sim, Retirado',
                    onPress: async () => {
                        const result = await confirmItemCollection(itemId);
                        if (result.success) load();
                        else Alert.alert('Erro', 'Não foi possível confirmar a retirada.');
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.tag}>
                    <Text style={styles.tagText}>{item.category}</Text>
                </View>
                <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}
            <View style={styles.requesterInfo}>
                <MaterialIcons name="person" size={14} color="#64748b" />
                <Text style={styles.requesterName}>{item.requester?.name || 'Alguém'} está precisando</Text>
            </View>
        </View>
    );

    const renderReservation = ({ item }: { item: any }) => (
        <View style={[styles.card, styles.reservationCard]}>
            <View style={styles.cardHeader}>
                <View style={[styles.tag, { backgroundColor: '#def7ec' }]}>
                    <Text style={[styles.tagText, { color: '#03543f' }]}>RESERVADO PARA VOCÊ</Text>
                </View>
                <MaterialIcons name="local-shipping" size={20} color="#003366" />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>

            <View style={styles.locationInfo}>
                <MaterialIcons name="location-on" size={16} color="#003366" />
                <View style={{ flex: 1 }}>
                    <Text style={styles.locationTitle}>ENDEREÇO DE RETIRADA:</Text>
                    <Text style={styles.locationText}>
                        {item.pickup_address || (item.warehouse ? item.warehouse.address : 'A combinar com doador')}
                    </Text>
                </View>
            </View>

            {item.pickup_instructions ? (
                <View style={styles.instructionBox}>
                    <MaterialIcons name="info" size={14} color="#64748b" />
                    <Text style={styles.instructionText}>{item.pickup_instructions}</Text>
                </View>
            ) : null}

            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={() => handleRelease(item)}
                >
                    <Text style={styles.declineText}>Recusar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleConfirmWhatsApp(item)}
                >
                    <MaterialIcons name="chat" size={16} color="#fff" />
                    <Text style={styles.acceptText}>Aceitar/Contatar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderMyDonation = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.card, item.status === 'reserved' && styles.myDonationReservedCard]}
            onPress={() => router.push(`/donate/${item.id}`)}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.tag, item.status === 'reserved' ? { backgroundColor: '#fef3c7' } : { backgroundColor: '#f1f5f9' }]}>
                    <Text style={[styles.tagText, item.status === 'reserved' ? { color: '#92400e' } : { color: '#64748b' }]}>
                        {item.status === 'reserved' ? 'RESERVADO POR ALGUÉM' : item.status === 'available' ? 'NA VITRINE' : 'DOADO'}
                    </Text>
                </View>
                <MaterialIcons
                    name={item.status === 'reserved' ? 'notification-important' : 'volunteer-activism'}
                    size={20}
                    color={item.status === 'reserved' ? '#92400e' : '#003366'}
                />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>

            {item.status === 'reserved' && item.requester && (
                <View style={styles.requesterCard}>
                    <Text style={styles.requesterTitle}>INTERESSADO:</Text>
                    <Text style={styles.requesterNameMain}>{item.requester.name}</Text>
                    <Text style={styles.requesterContact}>Aguarde o contato via WhatsApp para agendar.</Text>
                </View>
            )}

            <View style={styles.actionRow}>
                {item.status === 'reserved' && (
                    <TouchableOpacity
                        style={[styles.acceptBtn, { backgroundColor: '#059669', flex: 1.5 }]}
                        onPress={() => handleConfirmCollectionManual(item.id)}
                    >
                        <MaterialIcons name="check-circle" size={16} color="#fff" />
                        <Text style={styles.acceptText}>Confirmar Retirada</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.detailsBtnSmall}
                    onPress={() => router.push(`/donate/${item.id}`)}
                >
                    <Text style={styles.detailsBtnTextSmall}>Ver Detalhes</Text>
                    <MaterialIcons name="arrow-forward" size={14} color="#003366" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const combinedData = [
        ...(myReservations.length > 0 ? [{ type: 'header', title: 'Reservados para Você' }, ...myReservations] : []),
        ...(myDonations.length > 0 ? [{ type: 'header', title: 'Suas Doações' }, ...myDonations] : []),
        { type: 'header', title: 'Pedidos da Comunidade' },
        ...requests
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Pedidos</Text>
                <Text style={styles.headerSub}>O que as pessoas estão precisando no momento</Text>
            </View>

            {loading && !refreshing ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#003366" />
                </View>
            ) : (
                <FlatList
                    data={combinedData}
                    keyExtractor={(item, index) => item.id ? item.id.toString() : `header-${index}`}
                    contentContainerStyle={styles.list}
                    onRefresh={onRefresh}
                    refreshing={refreshing}
                    renderItem={({ item }) => {
                        if (item.type === 'header') {
                            return <Text style={styles.sectionHeader}>{item.title}</Text>;
                        }
                        if (item.user_id === user?.id) {
                            return renderMyDonation({ item });
                        }
                        return item.requested_by === user?.id && item.status === 'reserved'
                            ? renderReservation({ item })
                            : renderItem({ item });
                    }}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <MaterialIcons name="info-outline" size={48} color="#cbd5e1" />
                            <Text style={styles.emptyText}>Nada por aqui no momento.</Text>
                        </View>
                    }
                />
            )}

            <TouchableOpacity
                style={styles.fab}
                onPress={() => setModalVisible(true)}
            >
                <MaterialIcons name="add" size={28} color="#fff" />
                <Text style={styles.fabText}>Eu preciso...</Text>
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>O que você precisa?</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <MaterialIcons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Categoria</Text>
                        <View style={styles.categoryRow}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.catOption, category === cat && styles.catOptionActive]}
                                    onPress={() => setCategory(cat)}
                                >
                                    <Text style={[styles.catOptionText, category === cat && styles.catOptionTextActive]}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Item</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Cadeira de rodas, Alimentos, etc."
                            value={title}
                            onChangeText={setTitle}
                        />

                        <Text style={styles.label}>Detalhes (opcional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Descreva brevemente sua necessidade..."
                            multiline
                            numberOfLines={3}
                            value={description}
                            onChangeText={setDescription}
                        />

                        <TouchableOpacity
                            style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
                            onPress={handleCreateRequest}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.submitBtnText}>Postar Pedido</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#003366' },
    headerSub: { fontSize: 13, color: '#64748b', marginTop: 4 },

    list: { padding: 16, paddingBottom: 100 },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    tag: { backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    tagText: { fontSize: 10, color: '#2563eb', fontWeight: 'bold' },
    date: { fontSize: 11, color: '#94a3b8' },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
    cardDesc: { fontSize: 13, color: '#64748b', marginBottom: 12 },
    requesterInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
    requesterName: { fontSize: 12, color: '#64748b', fontWeight: '600' },

    sectionHeader: { fontSize: 14, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 16 },
    reservationCard: { borderLeftWidth: 4, borderLeftColor: '#003366', backgroundColor: '#f0f9ff' },
    locationInfo: { flexDirection: 'row', gap: 8, marginVertical: 12, backgroundColor: 'rgba(0,51,102,0.05)', padding: 12, borderRadius: 12 },
    locationTitle: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginBottom: 2 },
    locationText: { fontSize: 13, color: '#1e293b', lineHeight: 18 },
    instructionBox: { flexDirection: 'row', gap: 6, marginBottom: 16, paddingHorizontal: 4 },
    instructionText: { fontSize: 12, color: '#64748b', fontStyle: 'italic', flex: 1 },
    actionRow: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', paddingTop: 12 },

    myDonationReservedCard: { borderLeftWidth: 4, borderLeftColor: '#f59e0b', backgroundColor: '#fffbeb' },
    requesterCard: { backgroundColor: 'rgba(0,0,0,0.02)', padding: 12, borderRadius: 12, marginVertical: 8 },
    requesterTitle: { fontSize: 10, fontWeight: 'bold', color: '#64748b' },
    requesterNameMain: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginTop: 2 },
    requesterContact: { fontSize: 12, color: '#92400e', marginTop: 4, fontStyle: 'italic' },
    detailsBtnSmall: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'flex-end' },
    detailsBtnTextSmall: { fontSize: 13, color: '#003366', fontWeight: 'bold' },

    declineBtn: { flex: 1, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    declineText: { color: '#ef4444', fontWeight: 'bold', fontSize: 13 },
    acceptBtn: { flex: 2, height: 44, backgroundColor: '#003366', borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    acceptText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    empty: { alignItems: 'center', marginTop: 60 },
    emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 15 },

    fab: {
        position: 'absolute', bottom: 24, right: 24,
        backgroundColor: '#003366', flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 20, paddingVertical: 14, borderRadius: 30,
        elevation: 8, shadowColor: '#003366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8
    },
    fabText: { color: '#fff', fontWeight: 'bold', marginLeft: 8, fontSize: 15 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#003366' },
    label: { fontSize: 14, fontWeight: 'bold', color: '#64748b', marginBottom: 8, marginTop: 12 },
    categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
    catOptionActive: { backgroundColor: '#003366', borderColor: '#003366' },
    catOptionText: { fontSize: 12, color: '#475569', fontWeight: 'bold' },
    catOptionTextActive: { color: '#fff' },
    input: { backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, fontSize: 15, marginTop: 4 },
    textArea: { height: 80, textAlignVertical: 'top' },
    submitBtn: { backgroundColor: '#003366', height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
    submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
