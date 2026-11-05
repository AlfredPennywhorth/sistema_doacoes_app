import { useAuth } from '@/hooks/useAuth';
import { getDonations, getProfile } from '@/services/databaseService';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

declare global {
  interface Window {
    L?: any;
    __leafletLoadingPromise?: Promise<any>;
  }
}

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

function loadLeaflet() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Leaflet só pode ser carregado no navegador.'));
  }

  if (window.L) return Promise.resolve(window.L);
  if (window.__leafletLoadingPromise) return window.__leafletLoadingPromise;

  window.__leafletLoadingPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-css')) {
      const css = document.createElement('link');
      css.id = 'leaflet-css';
      css.rel = 'stylesheet';
      css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      css.integrity = 'sha256-p4NxAoJBhIINfQ3yn3u7tAp7T9Hn8E3GZr1B4w2x0mE=';
      css.crossOrigin = '';
      document.head.appendChild(css);
    }

    const existing = document.getElementById('leaflet-js') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L));
      existing.addEventListener('error', () => reject(new Error('Falha ao carregar o mapa.')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'leaflet-js';
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
    script.crossOrigin = '';
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Falha ao carregar o mapa.'));
    document.body.appendChild(script);
  });

  return window.__leafletLoadingPromise;
}

export default function MapScreenWeb() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [search, setSearch] = useState('');
  const [donations, setDonations] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any>(null);

  const loadData = React.useCallback(async () => {
    try {
      const data = await getDonations(null, null, true);
      setDonations(data || []);

      if (user) {
        const profile = await getProfile(user.id);
        setIsAdmin(Boolean(profile?.is_admin));
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

  const donationsWithPublicLocation = useMemo(
    () =>
      filteredDonations.filter((item) => {
        const lat = Number(item.public_latitude);
        const lng = Number(item.public_longitude);
        return Number.isFinite(lat) && Number.isFinite(lng);
      }),
    [filteredDonations]
  );

  useEffect(() => {
    let active = true;

    loadLeaflet()
      .then((L) => {
        if (!active || !L || mapRef.current) return;

        const element = document.getElementById('donations-map');
        if (!element) return;

        const map = L.map(element, {
          zoomControl: true,
          attributionControl: true,
        }).setView([-23.5505, -46.6333], 10);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        mapRef.current = map;
        markersRef.current = L.layerGroup().addTo(map);
        setMapReady(true);

        window.setTimeout(() => map.invalidateSize(), 0);
      })
      .catch((error) => {
        console.error('[MapScreenWeb] Erro ao inicializar Leaflet:', error);
        if (active) setMapError('Não foi possível carregar o mapa agora. A lista de doações continua disponível.');
      });

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !window.L || !mapRef.current || !markersRef.current) return;

    const L = window.L;
    const markers = markersRef.current;
    markers.clearLayers();

    const coordinates: [number, number][] = [];

    donationsWithPublicLocation.forEach((item) => {
      const lat = Number(item.public_latitude);
      const lng = Number(item.public_longitude);
      coordinates.push([lat, lng]);

      const marker = L.circleMarker([lat, lng], {
        radius: 8,
        color: categoryColor(item.category),
        fillColor: categoryColor(item.category),
        fillOpacity: 0.75,
        weight: 2,
      });

      marker.bindTooltip(item.title || 'Doação disponível', {
        direction: 'top',
        opacity: 0.95,
      });

      marker.on('click', () => {
        router.push({ pathname: '/donate/[id]', params: { id: item.id } });
      });

      marker.addTo(markers);
    });

    if (coordinates.length === 1) {
      mapRef.current.setView(coordinates[0], 13);
    } else if (coordinates.length > 1) {
      mapRef.current.fitBounds(L.latLngBounds(coordinates).pad(0.15), { maxZoom: 14 });
    }
  }, [donationsWithPublicLocation, mapReady, router]);

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

      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <View>
            <Text style={styles.mapTitle}>Mapa de doações</Text>
            <Text style={styles.mapSubtitle}>
              Exibe somente localização pública aproximada.
            </Text>
          </View>
          <View style={styles.mapCount}>
            <Text style={styles.mapCountText}>{donationsWithPublicLocation.length}</Text>
          </View>
        </View>

        <View nativeID="donations-map" style={styles.map} />

        {mapError && (
          <View style={styles.mapMessage}>
            <MaterialIcons name="info-outline" size={18} color="#475569" />
            <Text style={styles.mapMessageText}>{mapError}</Text>
          </View>
        )}

        {!mapError && mapReady && donationsWithPublicLocation.length === 0 && (
          <View style={styles.mapMessage}>
            <MaterialIcons name="location-off" size={18} color="#475569" />
            <Text style={styles.mapMessageText}>
              Nenhuma doação filtrada possui localização pública para exibir.
            </Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        <Text style={styles.sectionTitle}>Doações disponíveis</Text>
        {filteredDonations.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma doação encontrada.</Text>
        ) : (
          filteredDonations.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() => router.push({ pathname: '/donate/[id]', params: { id: item.id } })}
            >
              <View style={[styles.badge, { backgroundColor: `${categoryColor(item.category)}20` }]}>
                <MaterialIcons name={categoryIcon(item.category)} size={18} color={categoryColor(item.category)} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.meta}>{item.category}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#94a3b8" />
            </TouchableOpacity>
          ))
        )}
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
  mapCard: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  mapHeader: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
  },
  mapTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  mapSubtitle: { marginTop: 3, fontSize: 12, color: '#64748b' },
  mapCount: {
    minWidth: 34,
    height: 34,
    paddingHorizontal: 8,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0f2fe',
  },
  mapCountText: { color: '#0369a1', fontWeight: '700' },
  map: { width: '100%', height: 340, backgroundColor: '#e2e8f0' },
  mapMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
  },
  mapMessageText: { flex: 1, color: '#475569', fontSize: 13 },
  list: { padding: 12, paddingBottom: 32, gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#0f172a', marginBottom: 2 },
  emptyText: { color: '#64748b', paddingVertical: 18 },
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
