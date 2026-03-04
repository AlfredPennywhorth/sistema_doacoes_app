import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, ScrollView, Dimensions, Platform } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height;

export default function MapScreen() {
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>

        {/* --- MAP LAYER --- */}
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: -23.5505,
            longitude: -46.6333,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker coordinate={{ latitude: -23.5505, longitude: -46.6333 }}>
            <View style={[styles.markerPin, { backgroundColor: '#003366' }]}>
              <MaterialIcons name="restaurant" size={16} color="#fff" />
            </View>
            <View style={[styles.markerStem, { backgroundColor: '#003366' }]} />
          </Marker>

          <Marker coordinate={{ latitude: -23.5600, longitude: -46.6400 }}>
            <View style={[styles.markerPin, { backgroundColor: '#fff', borderColor: '#003366', borderWidth: 2 }]}>
              <MaterialIcons name="checkroom" size={16} color="#003366" />
            </View>
            <View style={[styles.markerStem, { backgroundColor: '#003366' }]} />
          </Marker>
        </MapView>

        {/* --- TOP HEADER CONTENT OVER MAP --- */}
        <View style={styles.headerAbsolute}>
          {/* Top Row: User & Actions */}
          <View style={styles.topRow}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <MaterialIcons name="person" size={24} color="#003366" />
              </View>
              <View>
                <Text style={styles.locationLabel}>LOCALIZAÇÃO</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.locationCity}>São Paulo, SP</Text>
                  <MaterialIcons name="expand-more" size={18} color="#003366" />
                </View>
              </View>
            </View>
            <View style={styles.actionsBox}>
              <TouchableOpacity style={styles.iconBtn}>
                <MaterialIcons name="share" size={20} color="#003366" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn}>
                <MaterialIcons name="notifications" size={20} color="#003366" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Row */}
          <View style={styles.searchRow}>
            <View style={styles.searchContainer}>
              <MaterialIcons name="search" size={20} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar doações próximas"
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
              />
            </View>
            <TouchableOpacity style={styles.filterBtn}>
              <MaterialIcons name="tune" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Tags Row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsScroll}>
            <TouchableOpacity style={[styles.tag, styles.tagActive]}>
              <MaterialIcons name="restaurant" size={14} color="#fff" />
              <Text style={styles.tagTextActive}>Alimentos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tag}>
              <MaterialIcons name="checkroom" size={14} color="#475569" />
              <Text style={styles.tagText}>Vestuário</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tag}>
              <MaterialIcons name="chair" size={14} color="#475569" />
              <Text style={styles.tagText}>Móveis</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tag}>
              <MaterialIcons name="menu-book" size={14} color="#475569" />
              <Text style={styles.tagText}>Bíblias/Hinos</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* --- FLOATING CONTROLS --- */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.mapBtn}>
            <MaterialIcons name="add" size={24} color="#003366" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapBtn}>
            <MaterialIcons name="remove" size={24} color="#003366" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.mapBtn, { backgroundColor: '#003366', marginTop: 10 }]}>
            <MaterialIcons name="my-location" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* --- BOTTOM FLOATING ITEM CARD --- */}
        <View style={styles.bottomCardContainer}>
          <View style={styles.itemCard}>
            <View style={styles.itemCardImgBox}>
              <Image source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtnSJ3GQ5lFwjuR31Hrkvdr9XyAOwJOamYV9k9Lm_KNmqyixWkBm9y5qf_g20SuPCdv7j0OsxxkhbSdKXTdYUeaZapnV4Knn1aS33--yGehJUGBmLq0jEHMIu7Gu55q0mJUXAq7zHVSlITMT-OpTm-Wvwui3g2mJOf-cqOpJXun8DMtvxiBfybye1O4nMScvmCurFEwjhmcyAZnKTtmoLyNVTNk0aoouZJiDspi7LhWj1d9EEUWKDalTPp6sErBpOIPVMpOTrehuY' }} style={styles.itemCardImg} />
            </View>
            <View style={styles.itemCardContent}>
              <View style={styles.itemBadgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Disponível</Text>
                </View>
                <View style={styles.distanceBadge}>
                  <MaterialIcons name="location-on" size={12} color="#94a3b8" />
                  <Text style={styles.distanceText}>0.6 km</Text>
                </View>
              </View>
              <Text style={styles.itemCardTitle} numberOfLines={1}>Cesta de Alimentos Orgânicos</Text>
              <Text style={styles.itemCardDesc} numberOfLines={1}>Doação de excedente para famílias necessitadas...</Text>

              <View style={styles.itemCardFooter}>
                <View style={styles.donorInfo}>
                  <View style={styles.donorAvatar} />
                  <Text style={styles.donorName}>Irmão João</Text>
                </View>
                <TouchableOpacity style={styles.btnDetails}>
                  <Text style={styles.btnDetailsText}>Ver Detalhes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  map: {
    width: width,
    height: MAP_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  headerAbsolute: {
    position: 'absolute',
    top: 0,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    zIndex: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
  },
  locationCity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#003366',
  },
  actionsBox: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsScroll: {
    flexDirection: 'row',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    gap: 4,
  },
  tagActive: {
    backgroundColor: '#003366',
    borderColor: '#003366',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tagTextActive: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    bottom: 220,
    gap: 8,
  },
  mapBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    right: 16,
    zIndex: 20,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemCardImgBox: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },
  itemCardImg: {
    width: '100%',
    height: '100%',
  },
  itemCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  badgeText: {
    color: '#003366',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  distanceText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  itemCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#003366',
    marginTop: 4,
  },
  itemCardDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  itemCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  donorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  donorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  donorName: {
    fontSize: 10,
    fontWeight: '500',
    color: '#475569',
  },
  btnDetails: {
    backgroundColor: '#003366',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnDetailsText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  markerPin: {
    padding: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  markerStem: {
    width: 2,
    height: 12,
    alignSelf: 'center',
    marginTop: -2,
  }
});
