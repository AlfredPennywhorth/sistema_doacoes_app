import { getDashboardStats } from '@/services/databaseService';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    const loadStats = React.useCallback(async () => {
        setLoading(true);
        const data = await getDashboardStats({
            category: selectedCategory,
            month: selectedMonth
        } as any);
        setStats(data);
        setLoading(false);
    }, [selectedCategory, selectedMonth]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#003366" />
                <Text style={styles.loadingText}>Carregando métricas...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#003366" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Dashboard de Impacto</Text>
                <TouchableOpacity onPress={loadStats}>
                    <MaterialIcons name="refresh" size={24} color="#003366" />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Gestão de Galpões Link */}
                <TouchableOpacity
                    style={styles.adminLink}
                    onPress={() => router.push('/admin/warehouses')}
                >
                    <View style={styles.adminLinkIcon}>
                        <MaterialIcons name="warehouse" size={20} color="#003366" />
                    </View>
                    <Text style={styles.adminLinkText}>Gerenciar Almoxarifados</Text>
                    <MaterialIcons name="chevron-right" size={20} color="#94a3b8" />
                </TouchableOpacity>

                {/* Filtros */}
                <Text style={styles.sectionTitle}>Filtros</Text>
                <View style={styles.filterSection}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                        <TouchableOpacity
                            style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
                            onPress={() => setSelectedCategory(null)}
                        >
                            <Text style={[styles.filterChipText, !selectedCategory && styles.filterChipTextActive]}>Todas Categorias</Text>
                        </TouchableOpacity>
                        {['ALIMENTOS', 'ITENS HOSPITALARES', 'LINHA BRANCA', 'MÓVEIS', 'ÓRGÃO ELETRÔNICO', 'VESTUÁRIO', 'OUTROS'].map(cat => (
                            <TouchableOpacity
                                key={cat}
                                style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
                                onPress={() => setSelectedCategory(cat)}
                            >
                                <Text style={[styles.filterChipText, selectedCategory === cat && styles.filterChipTextActive]}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.filterScroll, { marginTop: 10 }]}>
                        <TouchableOpacity
                            style={[styles.filterChip, !selectedMonth && styles.filterChipActive]}
                            onPress={() => setSelectedMonth(null)}
                        >
                            <Text style={[styles.filterChipText, !selectedMonth && styles.filterChipTextActive]}>Todos os Meses</Text>
                        </TouchableOpacity>
                        {/* Derive months from stats if total counts exist, but for now simple list or derive from data */}
                        {stats?.allMonths?.map((m: string) => (
                            <TouchableOpacity
                                key={m}
                                style={[styles.filterChip, selectedMonth === m && styles.filterChipActive]}
                                onPress={() => setSelectedMonth(m)}
                            >
                                <Text style={[styles.filterChipText, selectedMonth === m && styles.filterChipTextActive]}>{m}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* Resumo Geral */}
                <View style={styles.summaryRow}>
                    <View style={[styles.statCard, { backgroundColor: '#003366' }]}>
                        <Text style={styles.statValue}>{stats?.total || 0}</Text>
                        <Text style={styles.statLabel}>Total Doações</Text>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#059669' }]}>
                        <Text style={styles.statValue}>{stats?.byStatus?.donated || 0}</Text>
                        <Text style={styles.statLabel}>Itens Entregues</Text>
                    </View>
                </View>

                {/* Status Section */}
                <Text style={styles.sectionTitle}>Distribuição por Status</Text>
                <View style={styles.statusBox}>
                    <View style={styles.statusItem}>
                        <View style={[styles.statusDot, { backgroundColor: '#2563eb' }]} />
                        <Text style={styles.statusText}>Disponíveis</Text>
                        <Text style={styles.statusCount}>{stats?.byStatus?.available || 0}</Text>
                    </View>
                    <View style={styles.statusItem}>
                        <View style={[styles.statusDot, { backgroundColor: '#eab308' }]} />
                        <Text style={styles.statusText}>Reservados</Text>
                        <Text style={styles.statusCount}>{stats?.byStatus?.reserved || 0}</Text>
                    </View>
                    <View style={styles.statusItem}>
                        <View style={[styles.statusDot, { backgroundColor: '#059669' }]} />
                        <Text style={styles.statusText}>Entregues</Text>
                        <Text style={styles.statusCount}>{stats?.byStatus?.donated || 0}</Text>
                    </View>
                </View>

                {/* Categories Section */}
                <Text style={styles.sectionTitle}>Doações por Categoria</Text>
                <View style={styles.grid}>
                    {Object.entries(stats?.byCategory || {}).sort((a: any, b: any) => b[1] - a[1]).map(([cat, count]: any) => (
                        <View key={cat} style={styles.catCard}>
                            <Text style={styles.catName}>{cat}</Text>
                            <Text style={styles.catCount}>{count}</Text>
                        </View>
                    ))}
                </View>

                {/* Month Section */}
                <Text style={styles.sectionTitle}>Evolução Mensal</Text>
                <View style={styles.monthBox}>
                    {Object.entries(stats?.byMonth || {}).map(([month, count]: any) => (
                        <View key={month} style={styles.monthItem}>
                            <View style={styles.monthBarContainer}>
                                <View style={[styles.monthBar, { height: Math.max(10, (count / stats.total) * 100) }]} />
                            </View>
                            <Text style={styles.monthLabel}>{month}</Text>
                            <Text style={styles.monthCount}>{count}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#003366' },
    content: { padding: 16 },

    adminLink: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
        padding: 16, borderRadius: 16, marginBottom: 20,
        borderWidth: 1, borderColor: '#e2e8f0'
    },
    adminLinkIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(0,51,102,0.05)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    adminLinkText: { flex: 1, fontSize: 15, fontWeight: 'bold', color: '#003366' },

    summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statCard: { flex: 1, padding: 20, borderRadius: 16, alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    statValue: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
    statLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b', marginBottom: 12, marginTop: 12 },
    statusBox: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 24 },
    statusItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
    statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
    statusText: { flex: 1, fontSize: 14, color: '#475569' },
    statusCount: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
    catCard: {
        width: (width - 44) / 2, backgroundColor: '#fff', padding: 16,
        borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#003366'
    },
    catName: { fontSize: 12, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase' },
    catCount: { fontSize: 20, fontWeight: 'bold', color: '#003366', marginTop: 4 },

    monthBox: { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderRadius: 16, gap: 16, minHeight: 180 },
    monthItem: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
    monthBarContainer: { height: 100, width: 24, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'flex-end', overflow: 'hidden' },
    monthBar: { width: '100%', backgroundColor: '#003366', borderRadius: 12 },
    monthLabel: { fontSize: 10, color: '#64748b', marginTop: 8, fontWeight: '600' },
    monthCount: { fontSize: 12, fontWeight: 'bold', color: '#003366', marginTop: 2 },

    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
    loadingText: { marginTop: 12, color: '#64748b', fontSize: 15 },

    filterSection: { marginBottom: 24 },
    filterScroll: { paddingVertical: 4 },
    filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' },
    filterChipActive: { backgroundColor: '#003366', borderColor: '#003366' },
    filterChipText: { fontSize: 13, color: '#64748b', fontWeight: 'bold' },
    filterChipTextActive: { color: '#fff' },
});
