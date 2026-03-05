import React, { useEffect, useState } from 'react';
import {
    StyleSheet, View, Text, ScrollView, TouchableOpacity,
    Image, ActivityIndicator, Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getDonationById, requestItemWithLock } from '@/services/databaseService';
import { useAuth } from '@/hooks/useAuth';

export default function DonationDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { user } = useAuth();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reserving, setReserving] = useState(false);

    useEffect(() => {
        if (id) loadItem();
    }, [id]);

    const loadItem = async () => {
        setLoading(true);
        const data = await getDonationById(id);
        setItem(data);
        setLoading(false);
    };

    const handleReserve = async () => {
        if (!user) return;
        setReserving(true);
        const result = await requestItemWithLock(id, user.id);
        setReserving(false);
        if (result.success) {
            Alert.alert('✅ Reservado!', result.message, [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } else {
            Alert.alert('Ops!', result.message);
        }
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
                <Text style={styles.notFound}>Item não encontrado.</Text>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.notFoundLink}>Voltar</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#003366" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalhes</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Foto */}
                <View style={styles.imageBox}>
                    {item.image_url ? (
                        <Image source={{ uri: item.image_url }} style={styles.image} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <MaterialIcons name="image-not-supported" size={48} color="#cbd5e1" />
                        </View>
                    )}
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {item.status === 'available' ? 'Disponível' : 'Reservado'}
                        </Text>
                    </View>
                </View>

                {/* Info */}
                <View style={styles.infoBox}>
                    <View style={styles.categoryRow}>
                        <MaterialIcons name="label" size={14} color="#64748b" />
                        <Text style={styles.category}>{item.category}</Text>
                    </View>
                    <Text style={styles.title}>{item.title}</Text>
                    {item.description && (
                        <Text style={styles.description}>{item.description}</Text>
                    )}

                    {/* Doador */}
                    <View style={styles.donorBox}>
                        <View style={styles.donorAvatar}>
                            <MaterialIcons name="person" size={20} color="#003366" />
                        </View>
                        <View>
                            <Text style={styles.donorLabel}>Doador</Text>
                            <Text style={styles.donorName}>
                                {item.profiles?.name ?? 'Anônimo'}
                            </Text>
                        </View>
                    </View>

                    {/* Validade */}
                    {item.ttl_days && (
                        <View style={styles.infoRow}>
                            <MaterialIcons name="schedule" size={16} color="#64748b" />
                            <Text style={styles.infoText}>Válido por {item.ttl_days} dias</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Botão Reservar */}
            {item.status === 'available' && (
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
                                <MaterialIcons name="handshake" size={20} color="#fff" />
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
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
    notFound: { fontSize: 16, color: '#64748b', marginBottom: 12 },
    notFoundLink: { color: '#003366', fontWeight: 'bold' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#003366' },
    content: { padding: 16, paddingBottom: 100 },
    imageBox: { width: '100%', height: 240, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f1f5f9', marginBottom: 20, position: 'relative' },
    image: { width: '100%', height: '100%' },
    imagePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    badge: {
        position: 'absolute', top: 12, left: 12,
        backgroundColor: '#003366', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
    infoBox: { gap: 12 },
    categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    category: { fontSize: 12, color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#003366' },
    description: { fontSize: 15, color: '#475569', lineHeight: 22 },
    donorBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8fafc', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
    donorAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center' },
    donorLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' },
    donorName: { fontSize: 15, fontWeight: '600', color: '#003366' },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    infoText: { fontSize: 13, color: '#64748b' },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' },
    reserveBtn: {
        flexDirection: 'row', height: 56, backgroundColor: '#003366',
        borderRadius: 16, justifyContent: 'center', alignItems: 'center', gap: 8,
        shadowColor: '#003366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
    },
    reserveBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
