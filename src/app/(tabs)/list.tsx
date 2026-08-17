import { getDonations, getWarehouses } from "@/services/databaseService";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = [
  "TODOS",
  "ALIMENTOS",
  "ITENS HOSPITALARES",
  "LINHA BRANCA",
  "MÓVEIS",
  "ÓRGÃO ELETRÔNICO",
  "VESTUÁRIO",
  "OUTROS",
];

export default function ListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string }>();
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(
    params.category || "TODOS",
  );
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Warehouse Filter
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(
    null,
  );
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const categoryFilter =
        selectedCategory === "TODOS" ? null : selectedCategory;
      const data = await getDonations(categoryFilter as any, null, true);
      setDonations(data);

      const wData = await getWarehouses();
      setWarehouses(wData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredDonations = useMemo(() => {
    return donations.filter((item) => {
      if (selectedWarehouse === "PRIVATE" && item.warehouse_id !== null)
        return false;
      if (
        selectedWarehouse &&
        selectedWarehouse !== "PRIVATE" &&
        item.warehouse_id !== selectedWarehouse
      )
        return false;
      return true;
    });
  }, [donations, selectedWarehouse]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Vitrine de Itens</Text>
            <Text style={styles.headerSubtitle}>Ajude o próximo hoje</Text>
          </View>
          <TouchableOpacity
            style={styles.dashboardBtn}
            onPress={() => router.push("/admin/dashboard")}
          >
            <MaterialIcons name="dashboard" size={24} color="#003366" />
          </TouchableOpacity>
        </View>

        {/* Filtros */}
        <View style={styles.filterBar}>
          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowCategoryModal(true)}
          >
            <MaterialIcons name="category" size={18} color="#003366" />
            <Text style={styles.filterText} numberOfLines={1}>
              {selectedCategory}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={18} color="#003366" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterBtn}
            onPress={() => setShowWarehouseModal(true)}
          >
            <MaterialIcons name="warehouse" size={18} color="#003366" />
            <Text style={styles.filterText} numberOfLines={1}>
              {selectedWarehouse === "PRIVATE"
                ? "PARTICULAR"
                : warehouses.find((w) => w.id === selectedWarehouse)?.name ||
                  "LOCAL"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={20} color="#003366" />
          </TouchableOpacity>
        </View>

        {/* List */}
        {loading && !refreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#003366" />
          </View>
        ) : filteredDonations.length === 0 ? (
          <View style={styles.centered}>
            <MaterialIcons name="inbox" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>Nenhuma doação encontrada</Text>
            <TouchableOpacity onPress={load} style={styles.retryBtn}>
              <Text style={styles.retryText}>Atualizar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredDonations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={load} />
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/donate/${item.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: "#003366" },
                    ]}
                  >
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                  {item.is_urgent && (
                    <View style={styles.urgentBadge}>
                      <MaterialIcons
                        name="priority-high"
                        size={12}
                        color="#fff"
                      />
                      <Text style={styles.urgentText}>URGENTE</Text>
                    </View>
                  )}
                  {item.status === "reserved" && (
                    <View style={styles.reservedBadge}>
                      <MaterialIcons name="lock" size={12} color="#fff" />
                      <Text style={styles.reservedText}>RESERVADO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description ?? "Sem descrição"}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={styles.locationContainer}>
                    <MaterialIcons
                      name={item.warehouse ? "inventory" : "person-pin"}
                      size={16}
                      color="#64748b"
                    />
                    <Text style={styles.locationText}>
                      {item.warehouse ? item.warehouse.name : "Doador Particular"}
                    </Text>
                  </View>
                  <View style={styles.detailsBtn}>
                    <Text style={styles.detailsBtnText}>VER DETALHES</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/donate/new")}
        activeOpacity={0.85}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal Categoria */}
      <Modal visible={showCategoryModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowCategoryModal(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar Categoria</Text>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedCategory(cat);
                  setShowCategoryModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedCategory === cat && styles.modalOptionActive,
                  ]}
                >
                  {cat}
                </Text>
                {selectedCategory === cat && (
                  <MaterialIcons name="check" size={18} color="#003366" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Galpão */}
      <Modal visible={showWarehouseModal} transparent animationType="slide">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowWarehouseModal(false)}
          activeOpacity={1}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtrar Local</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setSelectedWarehouse(null);
                setShowWarehouseModal(false);
              }}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  !selectedWarehouse && styles.modalOptionActive,
                ]}
              >
                TODOS OS LOCAIS
              </Text>
              {!selectedWarehouse && (
                <MaterialIcons name="check" size={18} color="#003366" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setSelectedWarehouse("PRIVATE");
                setShowWarehouseModal(false);
              }}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  selectedWarehouse === "PRIVATE" && styles.modalOptionActive,
                ]}
              >
                PARTICULARES
              </Text>
              {selectedWarehouse === "PRIVATE" && (
                <MaterialIcons name="check" size={18} color="#003366" />
              )}
            </TouchableOpacity>
            {warehouses.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={styles.modalOption}
                onPress={() => {
                  setSelectedWarehouse(w.id);
                  setShowWarehouseModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedWarehouse === w.id && styles.modalOptionActive,
                  ]}
                >
                  {w.name}
                </Text>
                {selectedWarehouse === w.id && (
                  <MaterialIcons name="check" size={18} color="#003366" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#003366" },
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 15,
    backgroundColor: "#003366",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  headerSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  dashboardBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  filterBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  filterBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    gap: 6,
    justifyContent: "center",
  },
  filterText: { color: "#003366", fontWeight: "bold", fontSize: 12, flexShrink: 1 },
  listContent: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  urgentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc2626",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  urgentText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  reservedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#64748b",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 2,
  },
  reservedText: { color: "#fff", fontSize: 9, fontWeight: "bold" },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#64748b', marginBottom: 12 },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 10,
  },
  locationContainer: { flexDirection: "row", alignItems: "center", gap: 6 },
  locationText: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  detailsBtn: { borderBottomWidth: 1, borderBottomColor: "#003366", paddingBottom: 1 },
  detailsBtnText: { color: "#003366", fontSize: 10, fontWeight: "bold" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { marginTop: 12, color: "#64748b", fontSize: 14 },
  retryBtn: {
    marginTop: 16,
    backgroundColor: "#003366",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryText: { color: "#fff", fontWeight: "bold" },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#003366",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#003366",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalOptionText: { fontSize: 15, color: "#475569" },
  modalOptionActive: { color: "#003366", fontWeight: "bold" },
});
