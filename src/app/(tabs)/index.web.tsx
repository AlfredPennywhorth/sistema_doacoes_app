import { useAuth } from '@/hooks/useAuth';
import { getDonations, getProfile } from '@/services/databaseService';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function categoryColor(cat: string) {
  if (!cat) return '#003366';
  const c = cat.toUpperCase();
  if (c.includes('ALIMENTO')) return '#F59E0B';
  if (c.includes('VESTU')) return '#10B981';
  if (c.includes('MÓVEIS') || c.includes('MOVEIS')) return '#8B5CF6';
  if (c.includes('HOSPITAL')) return '#EF4444';
  if (c.includes('ÓRGÃO') || c.includes('ORGAO')) return '#EC4899';
  if (c.includes('BRANCA')) return '#3B82F6';
  return '#64748b';
}

function categoryIcon(cat: string) {
  if (!cat) return 'volunteer-activism';
  const c = cat.toUpperCase();
  if (c.includes('ALIMENTO')) return 'restaurant';
  if (c.includes('VESTU')) return 'checkroom';
  if (c.includes('MÓVEIS') || c.includes('MOVEIS')) return 'chair';
  if (c.includes('HOSPITAL')) return 'medical-services';
  if (c.includes('ÓRGÃO') || c.includes('ORGAO')) return 'music-note';
  if (c.includes('BRANCA')) return 'kitchen';
  return 'volunteer-activism';
}

export default function MapScreenWeb() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [search, setSearch] = useState('');
  const [donations, setDonations] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadData = React.useCallback(async () => {
    try {
      const data = await getDonations(null, null, true);
      setDonations(data || []);

      if (user) {
        const profile = await getProfile(user.id);
        if (profile?.is_admin) setIsAdmin(true);
      }
    } catch (error) {
      console.error('[MapScreenWeb] Erro ao carregar dados:', error);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDonations = useMemo(() => {
    if (!search.trim()) return donations;
    const s = search.toLowerCase();
    return donations.filter(
      (d) =>
        d.title?.toLowerCase().includes(s) ||
        d.category?.toLowerCase().includes(s) ||
        d.description?.toLowerCase().includes(s)
    );
  }, [donations, search]);

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja encerrar sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.topBar}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#64748b" />
          <TextInput
            placeholder="Buscar doações..."
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {isAdmin && (
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/admin/warehouses')}>
            <MaterialIcons name="settings" size={20} color="#003366" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')}>
          <MaterialIcons name="tune" size={20} color="#003366" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color="#003366" />
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <MaterialIcons name="map" size={36} color="#94a3b8" />
        <Text style={styles.heroTitle}>Mapa disponível no app móvel</Text>
        <Text style={styles.heroText}>No web você pode navegar pelas doações filtradas abaixo.</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filteredDonations.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => router.push({ pathname: '/(tabs)/list', params: { category: item.category } })}
          >
            <View style={[styles.badge, { backgroundColor: `${categoryColor(item.category)}20` }]}>
              <MaterialIcons name={categoryIcon(item.category)} size={18} color={categoryColor(item.category)} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>{item.category}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, marginLeft: 8, color: '#0f172a' },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#f8fafc',
  },
  heroTitle: { marginTop: 8, fontWeight: '700', color: '#0f172a', fontSize: 16 },
  heroText: { marginTop: 4, color: '#475569' },
  list: { padding: 12, gap: 10 },
  card: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: '#0f172a', fontWeight: '700' },
  meta: { color: '#64748b', marginTop: 2, fontSize: 12 },
});
