import { useAuth } from '@/hooks/useAuth';
import { confirmItemCollection, deleteItem, getDonationById, getProfile, releaseItem, requestItemWithLock } from '@/services/databaseService';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FeedbackType = 'success' | 'error' | null;

export default function DonationDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reserving, setReserving] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [feedback, setFeedback] = useState<{ type: FeedbackType; message: string } | null>(null);

    const loadItem = React.useCallback(async () => {
        setLoading(true);
        console.log('[Detalhes] Solicitando ID:', id);
        const data = await getDonationById(id as string);
        console.log('[Detalhes] Dados recebidos:', data);
        setItem(data);

        if (user) {
            const profile = await getProfile(user.id);
            if (profile?.is_admin) setIsAdmin(true);
        }
        setLoading(false);
    }, [id]);

    useEffect(() => {
        if (id) loadItem();
    }, [id, loadItem]);

    const showFeedback = (type: FeedbackType, message: string) => {
        setFeedback({ type, message });
        if (type === 'success') {
            setTimeout(() => setFeedback(null), 6000);
        } else {
            setTimeout(() => setFeedback(null), 4000);
        }
    };

    const handleReserve = async () => {
        if (!user) {
            showFeedback('error', 'Você precisa estar logado para reservar.');
            return;
        }

        setReserving(true);
        const result = await requestItemWithLock(id, user.id);
        setReserving(false);

        if (result.success) {
            showFeedback('success', '✅ Item reservado! Entre em contato com o doador.');
            loadItem();
        } else {
            showFeedback('error', result.message || 'Não foi possível reservar o item.');
        }
    };

    const handleCall = (phone: string) => {
        if (!phone) return;
        Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
    };

    const handleWhatsApp = (phone: string) => {
        if (!phone || !item) return;
        const donorName = item.donor?.name || 'Doador';
        const message = encodeURIComponent(
            `A paz de Deus,\n\n${donorName}\n\nReservei seu item "${item.title}" no app de doações e gostaria de agendar a retirada.\n\nSaudações`
        );
        Linking.openURL(`https://wa.me/55${phone.replace(/\D/g, '')}?text=${message}`);
    };

    const handleCancelReservation = async () => {
        Alert.alert(
            'Cancelar Reserva',
            'Deseja realmente cancelar esta reserva? O item voltará a ficar disponível para todos.',
            [
                { text: 'Não', style: 'cancel' },
                {
                    text: 'Sim, Cancelar',
                    style: 'destructive',
                    onPress: async () => {
                        setReserving(true);
                        const result = await releaseItem(id);
                        setReserving(false);
                        if (result.success) {
                            showFeedback('success', '✅ Reserva cancelada com sucesso.');
                            loadItem();
                        } else {
                            showFeedback('error', 'Erro ao cancelar reserva.');
                        }
                    }
                }
            ]
        );
    };

    const handleConfirmCollection = async () => {
        Alert.alert(
            'Confirmar Retirada',
            'O item foi retirado pelo recebedor? Isso irá marcar a doação como finalizada.',
            [
                { text: 'Não', style: 'cancel' },
                {
                    text: 'Sim, Retirado',
                    onPress: async () => {
                        setReserving(true);
                        const result = await confirmItemCollection(id);
                        setReserving(false);
                        if (result.success) {
                            showFeedback('success', '✅ Item marcado como retirado! Obrigado por doar.');
                            loadItem();
                        } else {
                            showFeedback('error', 'Erro ao confirmar retirada.');
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteItem = async () => {
        Alert.alert(
            'Excluir Item',
            'Deseja realmente apagar este item permanentemente? Esta ação não pode ser desfeita.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Excluir',
                    style: 'destructive',
                    onPress: async () => {
                        setReserving(true);
                        const result = await deleteItem(id);
                        setReserving(false);
                        if (result.success) {
                            router.replace('/(tabs)/list');
                        } else {
                            showFeedback('error', 'Erro ao excluir item.');
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.centered}>
                <ActivityIndicator size="large" color="#003366" />
            </SafeAreaView>
        );
    }

    if (!item) {
        return (
            <SafeAreaView style={styles.centered}>
                <MaterialIcons name="search-off" size={64} color="#cbd5e1" />
                <Text style={styles.notFound}>Item não encontrado ou indisponível.</Text>
                <TouchableOpacity onPress={() => router.replace('/(tabs)/list')} style={styles.backLink}>
                    <Text style={styles.notFoundLink}>Voltar para Vitrine</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    const isAvailable = item.status === 'available';
    const isReservedByMe = item.requested_by === user?.id;
    const donorName = item.donor?.name || 'Anônimo';
    const donorPhone = item.donor?.phone;

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#003366" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalhes do Item</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Banner de Feedback */}
            {feedback && (
                <View style={[styles.feedbackBanner, feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError]}>
                    <MaterialIcons
                        name={feedback.type === 'success' ? 'check-circle' : 'error'}
                        size={20}
                        color="#fff"
                    />
                    <Text style={styles.feedbackText}>{feedback.message}</Text>
                </View>
            )}

            <ScrollView contentContainerStyle={styles.content}>
                {/* Imagem */}
                <View style={styles.imageBox}>
                    {item.image_url ? (
                        <Image source={{ uri: item.image_url }} style={styles.image} resizeMode="cover" />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <MaterialIcons name="image-not-supported" size={64} color="#cbd5e1" />
                        </View>
                    )}
                    <View style={[
                        styles.badge,
                        item.status === 'reserved' && styles.badgeReserved,
                        item.status === 'donated' && styles.badgeDonated,
                        item.is_urgent && styles.badgeUrgent
                    ]}>
                        <Text style={styles.badgeText}>
                            {item.status === 'donated' ? 'RETIRADO' :
                                (item.is_urgent ? 'URGENTE' :
                                    (isAvailable ? 'Disponível' : (isReservedByMe ? 'Reservado por Você' : 'Reservado')))}
                        </Text>
                    </View>
                </View>

                {/* Informações Principais */}
                <View style={styles.infoBox}>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{item.category}</Text>
                    </View>

                    <Text style={styles.title}>{item.title}</Text>

                    {item.description && (
                        <Text style={styles.description}>{item.description}</Text>
                    )}

                    <View style={styles.divider} />

                    {/* Dados do Doador */}
                    <View style={styles.sectionHeader}>
                        <MaterialIcons name="person" size={20} color="#003366" />
                        <Text style={styles.sectionTitle}>Doador</Text>
                    </View>

                    <View style={styles.donorInfoCard}>
                        <Text style={styles.donorName}>{donorName}</Text>

                        {/* Informações de Retirada (Visíveis para doador ou quem reservou) */}
                        {(isReservedByMe || item.user_id === user?.id) && (item.status === 'reserved' || item.status === 'available') ? (
                            <View style={styles.pickupSection}>
                                <View style={styles.dividerSmall} />
                                <Text style={styles.pickupLabel}>LOCAL DE RETIRADA:</Text>
                                <Text style={styles.pickupValue}>{item.pickup_address || 'A combinar com doador'}</Text>

                                {item.pickup_instructions ? (
                                    <>
                                        <Text style={[styles.pickupLabel, { marginTop: 12 }]}>INSTRUÇÕES/HORÁRIOS:</Text>
                                        <Text style={styles.pickupValue}>{item.pickup_instructions}</Text>
                                    </>
                                ) : null}
                            </View>
                        ) : null}

                        {/* Exibe contato apenas se reservado por mim */}
                        {isReservedByMe && item.status !== 'donated' ? (
                            <View style={styles.contactContainer}>
                                <View style={styles.dividerSmall} />
                                <Text style={styles.contactLabel}>Fale com o doador para agendar:</Text>
                                {donorPhone ? (
                                    <View style={styles.contactButtons}>
                                        <TouchableOpacity
                                            style={[styles.contactBtn, styles.waBtn]}
                                            onPress={() => handleWhatsApp(donorPhone)}
                                        >
                                            <MaterialIcons name="chat" size={20} color="#fff" />
                                            <Text style={styles.contactBtnText}>WhatsApp</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.contactBtn, styles.phoneBtn]}
                                            onPress={() => handleCall(donorPhone)}
                                        >
                                            <MaterialIcons name="call" size={20} color="#fff" />
                                            <Text style={styles.contactBtnText}>Ligar</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <Text style={styles.noPhoneText}>Telefone não informado.</Text>
                                )}
                            </View>
                        ) : !isAvailable && item.status !== 'donated' && item.user_id !== user?.id ? (
                            <View style={styles.reservedNotByMe}>
                                <Text style={styles.reservedNotByMeText}>
                                    Informações de contato e endereço exato disponíveis apenas para quem reservou o item.
                                </Text>
                            </View>
                        ) : item.status === 'donated' ? (
                            <View style={styles.collectedBox}>
                                <Text style={styles.collectedText}>
                                    Este item já foi retirado e a doação concluída em {item.collected_at ? new Date(item.collected_at).toLocaleDateString() : '-'}.
                                </Text>
                            </View>
                        ) : item.user_id !== user?.id ? (
                            <Text style={styles.contactHint}>
                                Reserve o item para ver os contatos e agendar a retirada.
                            </Text>
                        ) : null}

                        {/* Botões de Ação para o Doador */}
                        {item.user_id === user?.id && item.status === 'reserved' && (
                            <View style={styles.donorActions}>
                                <TouchableOpacity
                                    style={styles.confirmCollectedBtn}
                                    onPress={handleConfirmCollection}
                                >
                                    <MaterialIcons name="check-circle" size={20} color="#059669" />
                                    <Text style={styles.confirmCollectedText}>Confirmar Retirada</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.cancelReservationBtn}
                                    onPress={handleCancelReservation}
                                >
                                    <MaterialIcons name="cancel" size={20} color="#dc2626" />
                                    <Text style={styles.cancelReservationText}>Liberar Item (Cancelar Reserva)</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.deleteBtn}
                                    onPress={handleDeleteItem}
                                >
                                    <MaterialIcons name="delete-forever" size={20} color="#b91c1c" />
                                    <Text style={styles.deleteBtnText}>Excluir Item Permanentemente</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Botão de Excluir para Admin (mesmo que não seja o dono) */}
                        {isAdmin && item.user_id !== user?.id && (
                            <TouchableOpacity
                                style={[styles.deleteBtn, { marginTop: 16 }]}
                                onPress={handleDeleteItem}
                            >
                                <MaterialIcons name="admin-panel-settings" size={20} color="#b91c1c" />
                                <Text style={styles.deleteBtnText}>Excluir como Administrador</Text>
                            </TouchableOpacity>
                        )}

                        {/* Botão de Cancelar para o Requerente */}
                        {isReservedByMe && (
                            <TouchableOpacity
                                style={[styles.cancelReservationBtn, { marginTop: 16 }]}
                                onPress={handleCancelReservation}
                            >
                                <MaterialIcons name="undo" size={20} color="#dc2626" />
                                <Text style={styles.cancelReservationText}>Desistir da Reserva</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Rodapé com Ação */}
            {isAvailable && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.reserveBtn, reserving && { opacity: 0.7 }]}
                        onPress={handleReserve}
                        disabled={reserving}
                        activeOpacity={0.8}
                    >
                        {reserving
                            ? <ActivityIndicator color="#fff" />
                            : <>
                                <MaterialIcons name="handshake" size={24} color="#fff" />
                                <Text style={styles.reserveBtnText}>Reservar Agora</Text>
                            </>
                        }
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', padding: 20 },
    notFound: { fontSize: 18, color: '#64748b', marginTop: 16, textAlign: 'center' },
    backLink: { marginTop: 24, paddingVertical: 12, paddingHorizontal: 24, backgroundColor: '#f1f5f9', borderRadius: 12 },
    notFoundLink: { color: '#003366', fontWeight: 'bold', fontSize: 16 },

    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#003366' },

    feedbackBanner: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 16, paddingVertical: 14,
        marginHorizontal: 16, marginTop: 16, borderRadius: 12,
        elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4,
    },
    feedbackSuccess: { backgroundColor: '#059669' },
    feedbackError: { backgroundColor: '#dc2626' },
    feedbackText: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },

    content: { paddingBottom: 120 },
    imageBox: { width: '100%', height: 300, backgroundColor: '#f1f5f9', position: 'relative' },
    image: { width: '100%', height: '100%' },
    imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    badge: {
        position: 'absolute', bottom: 16, left: 16,
        backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    },
    badgeReserved: { backgroundColor: '#92400e' },
    badgeDonated: { backgroundColor: '#475569' },
    badgeUrgent: { backgroundColor: '#dc2626' },
    badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

    infoBox: { padding: 20 },
    categoryBadge: { alignSelf: 'flex-start', backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginBottom: 12 },
    categoryText: { color: '#2563eb', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
    title: { fontSize: 28, fontWeight: '800', color: '#003366', marginBottom: 12 },
    description: { fontSize: 16, color: '#475569', lineHeight: 24, marginBottom: 20 },

    divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 20 },

    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#003366' },

    donorInfoCard: { backgroundColor: '#f8fafc', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
    donorName: { fontSize: 20, fontWeight: '700', color: '#003366', marginBottom: 12 },

    contactContainer: { marginTop: 8 },
    contactLabel: { fontSize: 14, color: '#64748b', marginBottom: 12, fontWeight: '600' },
    contactButtons: { flexDirection: 'row', gap: 12 },
    contactBtn: { flex: 1, flexDirection: 'row', height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 8 },
    waBtn: { backgroundColor: '#25d366' },
    phoneBtn: { backgroundColor: '#003366' },
    contactBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

    noPhoneText: { color: '#94a3b8', fontStyle: 'italic', marginTop: 4 },
    contactHint: { fontSize: 14, color: '#94a3b8', fontStyle: 'italic', lineHeight: 20 },
    reservedNotByMe: { backgroundColor: '#fff7ed', padding: 12, borderRadius: 10 },
    reservedNotByMeText: { fontSize: 13, color: '#9a3412', lineHeight: 18 },
    collectedBox: { backgroundColor: '#f1f5f9', padding: 12, borderRadius: 10 },
    collectedText: { fontSize: 13, color: '#475569', fontStyle: 'italic' },

    pickupSection: { marginBottom: 16 },
    pickupLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748b', marginBottom: 4 },
    pickupValue: { fontSize: 15, color: '#1e293b', lineHeight: 20 },
    dividerSmall: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 16 },

    donorActions: { gap: 12 },
    confirmCollectedBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: 12,
        borderWidth: 1, borderColor: '#059669', backgroundColor: '#ecfdf5'
    },
    confirmCollectedText: { color: '#059669', fontWeight: 'bold', fontSize: 14 },
    cancelReservationBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: 12,
        borderWidth: 1, borderColor: '#fee2e2', backgroundColor: '#fff'
    },
    cancelReservationText: { color: '#dc2626', fontWeight: 'bold', fontSize: 14 },

    deleteBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 14, borderRadius: 12, marginTop: 12,
        borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fef2f2'
    },
    deleteBtnText: { color: '#b91c1c', fontWeight: 'bold', fontSize: 14 },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    reserveBtn: {
        flexDirection: 'row', height: 64, backgroundColor: '#003366',
        borderRadius: 20, justifyContent: 'center', alignItems: 'center', gap: 12,
        shadowColor: '#003366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    reserveBtnText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
});
