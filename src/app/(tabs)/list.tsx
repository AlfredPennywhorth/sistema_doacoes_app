import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getDonations } from '@/services/databaseService';

const CATEGORIES = ['TODOS', 'ALIMENTOS', 'VESTUÁRIO', 'MÓVEIS', 'BÍBLIAS/HINOS', 'OUTROS'];

export default function ListScreen() {
    const router = useRouter();
    const [donations, setDonations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('TODOS');

    const load = useCallback(async () => {
        setLoading(true);
        const cat = activeCategory === 'TODOS' ? null : activeCategory;
        const data = await getDonations(cat as any);
        setDonations(data);
        setLoading(false);
    }, [activeCategory]);

    useEffect(() => { load(); }, [load]);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ width: 36 }} />
                    <Text style={styles.headerTitle}>Vitrine de Itens</Text>
                    <TouchableOpacity style={styles.headerBtn} onPress={load}>
                        <MaterialIcons name="refresh" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Categories */}
                <View style={styles.tagsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
                        {CATEGORIES.map((cat) => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.tag, activeCategory === cat && styles.tagActive]}
                                onPress={() => setActiveCategory(cat)}
                            >
                                <Text style={[styles.tagText, activeCategory === cat && styles.tagTextActive]}>
                                    {cat}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* List */}
                {loading ? (
                    <View style={styles.centered}>
                        <ActivityIndicator size="large" color="#1a365d" />
                    </View>
                ) : donations.length === 0 ? (
                    <View style={styles.centered}>
                        <MaterialIcons name="inbox" size={48} color="#cbd5e1" />
                        <Text style={styles.emptyText}>Nenhuma doação encontrada</Text>
                        <TouchableOpacity onPress={load} style={styles.retryBtn}>
                            <Text style={styles.retryText}>Atualizar</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
                        {donations.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.card}
                                activeOpacity={0.8}
                                onPress={() => router.push(`/donate/${item.id}` as any)}
                            >
                                <View style={styles.cardImgBox}>
                                    {item.image_url
                                        ? <Image source={{ uri: item.image_url }} style={styles.cardImg} />
                                        : <View style={[styles.cardImg, styles.noImage]}>
                                            <MaterialIcons name="image" size={32} color="#cbd5e1" />
                                        </View>
                                    }
                                </View>
                                <View style={styles.cardInfo}>
                                    <View style={styles.cardHeader}>
                                        <Text style={styles.cardCategory}>{item.category}</Text>
                                        <View style={styles.distanceBadge}>
                                            <MaterialIcons name="my-location" size={10} color="#1a365d" />
                                            <Text style={styles.distanceText}>Disponível</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                                    <Text style={styles.cardDesc} numberOfLines={1}>{item.description ?? '—'}</Text>
                                    <View style={styles.cardFooter}>
                                        <Text style={styles.postedText}>
                                            {item.profiles?.name ?? 'Anônimo'}
                                        </Text>
                                        <View style={styles.detailsBtn}>
                                            <Text style={styles.detailsBtnText}>VER DETALHES</Text>
                                        </View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                        <View style={{ height: 100 }} />
                    </ScrollView>
                )}
            </View>

            {/* FAB Nova Doação */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/donate/new')}
                activeOpacity={0.85}
            >
                <MaterialIcons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#1a365d' },
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        backgroundColor: '#1a365d',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3 },
            android: { elevation: 4 },
        }),
    },
    headerBtn: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
    tagsContainer: { backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    tagsScroll: { paddingHorizontal: 16, gap: 8 },
    tag: { height: 32, paddingHorizontal: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    tagActive: { backgroundColor: '#1a365d', borderColor: '#1a365d' },
    tagText: { color: '#475569', fontSize: 10, fontWeight: 'bold' },
    tagTextActive: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
    listContainer: { flex: 1 },
    listContent: { padding: 16, gap: 12 },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyText: { color: '#94a3b8', fontSize: 15, fontWeight: '500' },
    retryBtn: { paddingHorizontal: 20, paddingVertical: 8, backgroundColor: '#1a365d', borderRadius: 8 },
    retryText: { color: '#fff', fontWeight: 'bold' },
    card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
    cardImgBox: { width: 96, height: 96, borderRadius: 8, backgroundColor: '#f1f5f9', overflow: 'hidden' },
    cardImg: { width: '100%', height: '100%' },
    noImage: { alignItems: 'center', justifyContent: 'center' },
    cardInfo: { flex: 1, justifyContent: 'space-between' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardCategory: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(26,54,93,0.7)' },
    distanceBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0', gap: 2 },
    distanceText: { color: '#1a365d', fontSize: 9, fontWeight: 'bold' },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1a365d', marginBottom: 2 },
    cardDesc: { fontSize: 11, color: '#64748b', marginBottom: 8 },
    cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    postedText: { fontSize: 9, color: '#94a3b8', fontWeight: '600' },
    detailsBtn: { borderBottomWidth: 1, borderBottomColor: 'rgba(26,54,93,0.2)', paddingBottom: 2 },
    detailsBtnText: { color: '#1a365d', fontSize: 10, fontWeight: 'bold' },
    fab: {
        position: 'absolute', bottom: 24, right: 20,
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: '#003366',
        alignItems: 'center', justifyContent: 'center',
        shadowColor: '#003366', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },
});
