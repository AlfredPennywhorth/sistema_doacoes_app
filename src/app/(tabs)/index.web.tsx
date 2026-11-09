import { useAuth } from '@/hooks/useAuth';
import { getPublicMapCoordinates } from '@/utils/publicMapCoordinates';
import { getDonations, getProfile } from '@/services/databaseService';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

declare global {
  interface Window {
    maplibregl?: any;
    __mapLibreLoadingPromise?: Promise<any>;
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

// Vetores OpenFreeMap: sem chave e sem acesso direto aos tiles comunitarios do OSM.
const MAPLIBRE_VERSION = '5.24.0';
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// Dois CDNs para o mesmo arquivo/versionamento. A falha em um provedor
// não deve inutilizar a tela. A lista de doações continua disponível.
const MAPLIBRE_CDNS = [
  `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/`,
  `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VERSION}/dist/`,
];
const SCRIPT_TIMEOUT_MS = 12000;

function loadMapLibreFrom(src: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.maplibreLoader = 'true';
    let finished = false;
    const done = (error?: Error) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      script.onload = null;
      script.onerror = null;
      if (error) {
        script.remove();
        reject(error);
      } else {
        resolve(window.maplibregl);
      }
    };
    const timeout = window.setTimeout(
      () => done(new Error('Tempo limite para baixar o MapLibre.')),
      SCRIPT_TIMEOUT_MS
    );
    script.onload = () =>
      done(window.maplibregl ? undefined : new Error('MapLibre não inicializou.'));
    script.onerror = () => done(new Error('Falha ao baixar a biblioteca MapLibre.'));
    document.body.appendChild(script);
  });
}

function loadMapLibre(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Mapa web disponível apenas no navegador.'));
  }
  if (window.maplibregl) return Promise.resolve(window.maplibregl);
  if (window.__mapLibreLoadingPromise) return window.__mapLibreLoadingPromise;

  window.__mapLibreLoadingPromise = (async () => {
    // O CSS é necessário para controles, marcadores e apresentação do mapa.
    if (!document.getElementById('maplibre-css')) {
      const css = document.createElement('link');
      css.id = 'maplibre-css';
      css.rel = 'stylesheet';
      css.href = `${MAPLIBRE_CDNS[0]}maplibre-gl.css`;
      css.onerror = () => {
        console.warn('[MapScreenWeb] CSS do MapLibre indisponível no CDN primário.');
        css.onerror = null;
        css.href = `${MAPLIBRE_CDNS[1]}maplibre-gl.css`;
      };
      document.head.appendChild(css);
    }

    for (const base of MAPLIBRE_CDNS) {
      try {
        return await loadMapLibreFrom(`${base}maplibre-gl.js`);
      } catch (error) {
        console.warn('[MapScreenWeb] Falha no provedor de mapa:', base, error);
      }
    }
    throw new Error('Não foi possível carregar o MapLibre nos provedores disponíveis.');
  })().catch((error) => {
    window.__mapLibreLoadingPromise = undefined;
    document.querySelectorAll('script[data-maplibre-loader="true"]')
      .forEach((script) => script.remove());
    throw error;
  });

  return window.__mapLibreLoadingPromise;
}

export default function MapScreenWeb() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [search, setSearch] = useState('');
  const [donations, setDonations] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [donationsError, setDonationsError] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const loadData = React.useCallback(async () => {
    setDonationsError(false);
    try {
      const data = await getDonations(null, null, true);
      setDonations(data || []);

      if (user) {
        const profile = await getProfile(user.id);
        setIsAdmin(Boolean(profile?.is_admin));
      }
    } catch (error) {
      console.error('[MapScreenWeb] Erro ao carregar dados:', error instanceof Error ? error.message : 'unknown');
      setDonationsError(true);
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
      filteredDonations.filter((item) => getPublicMapCoordinates(item) !== null),
    [filteredDonations]
  );

  useEffect(() => {
    let active = true;
    let mapLoadTimeout: ReturnType<typeof setTimeout> | undefined;
    setMapReady(false);
    setMapError(null);

    loadMapLibre()
      .then((MapLibre) => {
        if (!active || !MapLibre || mapRef.current) return;

        const element = document.getElementById('donations-map');
        if (!element) return;

        // MapLibre GL JS v5.24 distribuído em UMD não garante a API
        // estática supported(). O erro "supported is not a function"
        // interrompia o mapa antes da criação do objeto.
        if (typeof MapLibre.Map !== 'function') {
          setMapError('Biblioteca do mapa inválida. Tente novamente.');
          return;
        }

        let map: any;
        try {
          map = new MapLibre.Map({
          container: element,
          style: MAP_STYLE,
          center: [-46.6333, -23.5505],
          zoom: 10,
          attributionControl: true,
          });
        } catch (error) {
          console.error('[MapScreenWeb] Erro na criação do mapa:', error);
          setMapError('O navegador não conseguiu inicializar o mapa interativo.');
          return;
        }

        map.addControl(new MapLibre.NavigationControl(), 'top-left');
        mapRef.current = map;

        mapLoadTimeout = setTimeout(() => {
          if (active) setMapError('O mapa demorou para carregar. Tente novamente ou consulte a lista de doações.');
        }, 20000);
        map.once('load', () => {
          if (mapLoadTimeout) clearTimeout(mapLoadTimeout);
          if (active) {
            setMapError(null);
            setMapReady(true);
            map.resize();
          }
        });
        map.on('error', (event: any) => {
          console.error('[MapScreenWeb] Falha de recurso do mapa:', event.error);
          // Erros isolados de tile não devem esconder um mapa já funcional.
          // Falhas na inicialização são diagnosticadas na homologação.
        });
      })
      .catch((error) => {
        console.error('[MapScreenWeb] Erro ao inicializar mapa:', error);
        if (active) setMapError('Nao foi possivel carregar o mapa. A lista de doacoes continua disponivel.');
      });

    return () => {
      active = false;
      if (mapLoadTimeout) clearTimeout(mapLoadTimeout);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapAttempt]);

  useEffect(() => {
    if (!mapReady || !window.maplibregl || !mapRef.current) return;

    const MapLibre = window.maplibregl;
    const map = mapRef.current;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const coordinates: [number, number][] = [];

    donationsWithPublicLocation.forEach((item) => {
      const point = getPublicMapCoordinates(item);
      if (!point) return;
      const [lng, lat] = point;
      coordinates.push(point);

      const marker = new MapLibre.Marker({ color: categoryColor(item.category) })
        .setLngLat([lng, lat])
        .addTo(map);

      const element = marker.getElement();
      element.title = item.title || 'Ver doacao';
      element.setAttribute('role', 'button');
      element.setAttribute('tabindex', '0');
      const navigateToItem = () => {
        router.push({ pathname: '/donate/[id]', params: { id: item.id } });
      };
      element.addEventListener('click', navigateToItem);
      element.addEventListener('keydown', (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          navigateToItem();
        }
      });

      markersRef.current.push(marker);
    });

    if (coordinates.length === 1) {
      map.flyTo({ center: coordinates[0], zoom: 13 });
    } else if (coordinates.length > 1) {
      const bounds = new MapLibre.LngLatBounds(coordinates[0], coordinates[0]);
      coordinates.slice(1).forEach((point) => bounds.extend(point));
      map.fitBounds(bounds, { padding: 40, maxZoom: 14 });
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
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Tentar carregar mapa novamente"
              onPress={() => setMapAttempt((attempt) => attempt + 1)}
              style={styles.retryMap}
            >
              <Text style={styles.retryMapText}>Tentar novamente</Text>
            </TouchableOpacity>
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
        {donationsError ? (
          <View style={{ gap: 10 }}>
            <Text style={styles.emptyText}>Não foi possível carregar as doações. Tente novamente.</Text>
            <TouchableOpacity onPress={loadData} accessibilityRole="button">
              <Text style={styles.title}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : filteredDonations.length === 0 ? (
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
  retryMap: { paddingVertical: 8, paddingHorizontal: 10, backgroundColor: '#e0f2fe', borderRadius: 8 },
  retryMapText: { color: '#0369a1', fontSize: 12, fontWeight: '700' },
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
