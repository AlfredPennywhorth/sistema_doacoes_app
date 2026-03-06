import { useAuth } from '@/hooks/useAuth';
import { getDonations, getProfile } from '@/services/databaseService';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Carrega react-native-maps apenas se disponível
let MapView: any = null;
let Marker: any = null;
try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
} catch (e) {
  // Módulo nativo não disponível
}

const { width, height } = Dimensions.get('window');

function categoryColor(cat: string) {
  if (!cat) return '#003366';
  const c = cat.toUpperCase();
  if (c.includes('ALIMENTO')) return '#F59E0B'; // Amarelo/Laranja
  if (c.includes('VESTU')) return '#10B981';    // Verde
  if (c.includes('MÓVEIS') || c.includes('MOVEIS')) return '#8B5CF6'; // Roxo
  if (c.includes('HOSPITAL')) return '#EF4444'; // Vermelho
  if (c.includes('ÓRGÃO') || c.includes('ORGAO')) return '#EC4899'; // Rosa
  if (c.includes('BRANCA')) return '#3B82F6';   // Azul Claro
  return '#64748b'; // Cinza para OUTROS
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

export default function MapScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [search, setSearch] = useState('');
  const [donations, setDonations] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadData = React.useCallback(async () => {
    try {
      // Para as estatísticas, queremos ver inclusive itens reservados para entender a "adesão"
      const data = await getDonations(null, null, true);
      setDonations(data || []);

      if (user) {
        const profile = await getProfile(user.id);
        if (profile?.is_admin) setIsAdmin(true);
      }
    } catch (error) {
      console.error('[MapScreen] Erro ao carregar dados:', error);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDonations = useMemo(() => {
    if (!search.trim()) return donations;
    const s = search.toLowerCase();
    return donations.filter(d =>
      d.title?.toLowerCase().includes(s) ||
      d.category?.toLowerCase().includes(s) ||
      d.description?.toLowerCase().includes(s)
    );
  }, [donations, search]);

  const filteredStats = useMemo(() => {
    // Agrupar estatísticas das doações filtradas
    const categoryMap: { [key: string]: { available: number, reserved: number } } = {};

    filteredDonations.forEach(d => {
      if (!categoryMap[d.category]) {
        categoryMap[d.category] = { available: 0, reserved: 0 };
      }
      if (d.status === 'available') categoryMap[d.category].available++;
      else if (d.status === 'reserved') categoryMap[d.category].reserved++;
    });

    return Object.keys(categoryMap).map(cat => ({
      category: cat,
      ...categoryMap[cat]
    })).sort((a, b) => b.available - a.available);
  }, [filteredDonations]);

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja encerrar sua sessão?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>

        {/* --- CAMADA DO MAPA --- */}
        {MapView ? (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: -23.5505,
              longitude: -46.6333,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
          >
            {filteredDonations.filter(d => d.latitude && d.longitude).map((d) => (
              <Marker
                key={d.id}
                coordinate={{ latitude: d.latitude, longitude: d.longitude }}
                onCalloutPress={() => router.push({ pathname: '/(tabs)/list', params: { category: d.category } })}
              >
                <View style={[
                  styles.markerPin,
                  { backgroundColor: d.status === 'reserved' ? '#cbd5e1' : (d.is_urgent ? '#dc2626' : categoryColor(d.category)) }
                ]}>
                  <MaterialIcons name={categoryIcon(d.category)} size={16} color="#fff" />
                </View>
                <View style={[
                  styles.markerStem,
                  { backgroundColor: d.status === 'reserved' ? '#cbd5e1' : (d.is_urgent ? '#dc2626' : categoryColor(d.category)) }
                ]} />
              </Marker>
            ))}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <MaterialIcons name="map" size={64} color="#e2e8f0" />
            <Text style={styles.placeholderText}>Mapa disponível no dispositivo real</Text>
          </View>
        )}

        {/* --- CONTROLES SUPERIORES --- */}
        <View style={styles.topContainer}>
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
            <TouchableOpacity
              style={styles.adminFab}
              onPress={() => router.push('/admin/warehouses')}
            >
              <MaterialIcons name="settings" size={22} color="#fff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#003366" />
          </TouchableOpacity>
        </View>

        {/* --- RESUMO POR CATEGORIA (SUBSTITUI O CARD) --- */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Monitor de Doações</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
            {filteredStats.length === 0 ? (
              <Text style={styles.noStatsText}>Nenhum item encontrado.</Text>
            ) : (
              filteredStats.map((s, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.statCard}
                  onPress={() => router.push({ pathname: '/(tabs)/list', params: { category: s.category } })}
                >
                  <View style={[styles.statIconBox, { backgroundColor: categoryColor(s.category) + '20' }]}>
                    <MaterialIcons name={categoryIcon(s.category)} size={20} color={categoryColor(s.category)} />
                  </View>
                  <View>
                    <Text style={styles.statCatName}>{s.category}</Text>
                    <View style={styles.statNumbers}>
                      <Text style={styles.statAvail}>{s.available} disp.</Text>
                      <View style={styles.statDot} />
                      <Text style={styles.statResv}>{s.reserved} res.</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, position: 'relative' },
  map: { width: width, height: height },
  mapPlaceholder: { flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: '#94a3b8', marginTop: 12, fontSize: 13 },

  markerPin: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  markerStem: { width: 4, height: 6, alignSelf: 'center', marginTop: -2 },

  topContainer: {
    position: 'absolute', top: 20, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 100
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', paddingHorizontal: 16, height: 50,
    borderRadius: 25, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 5,
  },
  searchInput: { flex: 1, height: 50, marginLeft: 10, fontSize: 15, color: '#1e293b' },

  logoutBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', elevation: 5 },
  adminFab: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#b91c1c', alignItems: 'center', justifyContent: 'center', elevation: 5 },

  summaryContainer: {
    position: 'absolute', bottom: 10, left: 10, right: 10,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 24,
    padding: 16, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10,
  },
  summaryTitle: { fontSize: 11, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, paddingLeft: 4 },
  statsScroll: { gap: 12, paddingRight: 20 },
  statCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 12, borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', gap: 10, minWidth: 150
  },
  statIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  statCatName: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  statNumbers: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statAvail: { fontSize: 11, color: '#059669', fontWeight: 'bold' },
  statResv: { fontSize: 11, color: '#94a3b8' },
  statDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#cbd5e1', marginHorizontal: 6 },
  noStatsText: { color: '#94a3b8', padding: 20, fontSize: 13 },
});
