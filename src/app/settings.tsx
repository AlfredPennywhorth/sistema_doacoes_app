import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../config/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteAccount = async () => {
    if (confirmText !== 'EXCLUIR') {
      Alert.alert('Erro', 'Digite EXCLUIR para confirmar.');
      return;
    }

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {});

      if (error) throw error;
      
      Alert.alert('Conta excluída', 'Sua conta e dados pessoais foram apagados com sucesso.', [
        { text: 'OK', onPress: () => signOut() }
      ]);
    } catch (err: any) {
      console.error(err);
      Alert.alert('Erro', 'Não foi possível excluir a conta. Tente novamente mais tarde.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#003366" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/legal/privacy')}>
          <MaterialIcons name="privacy-tip" size={24} color="#64748b" />
          <Text style={styles.menuText}>Política de Privacidade</Text>
          <MaterialIcons name="chevron-right" size={24} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/legal/terms')}>
          <MaterialIcons name="description" size={24} color="#64748b" />
          <Text style={styles.menuText}>Termos de Uso</Text>
          <MaterialIcons name="chevron-right" size={24} color="#cbd5e1" />
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity 
          style={styles.menuItemDelete} 
          onPress={() => setShowDeleteConfirm(!showDeleteConfirm)}
        >
          <MaterialIcons name="delete-forever" size={24} color="#dc2626" />
          <Text style={styles.menuTextDelete}>Excluir Minha Conta</Text>
          <MaterialIcons name={showDeleteConfirm ? "expand-less" : "expand-more"} size={24} color="#dc2626" />
        </TouchableOpacity>

        {showDeleteConfirm && (
          <View style={styles.deleteBox}>
            <Text style={styles.deleteWarnTitle}>Atenção!</Text>
            <Text style={styles.deleteWarnText}>
              Esta ação é irreversível. Todas as suas doações ativas, fotos, endereços e dados pessoais serão removidos permanentemente.
            </Text>
            <Text style={styles.deletePrompt}>Digite EXCLUIR abaixo para confirmar:</Text>
            
            <TextInput 
              style={styles.input}
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder="EXCLUIR"
              autoCapitalize="characters"
            />
            
            <TouchableOpacity 
              style={[styles.btnDelete, confirmText !== 'EXCLUIR' && { opacity: 0.5 }]} 
              onPress={handleDeleteAccount}
              disabled={confirmText !== 'EXCLUIR' || isDeleting}
            >
              {isDeleting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnDeleteText}>Confirmar Exclusão</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  content: { padding: 16 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  menuText: { flex: 1, fontSize: 16, color: '#334155', marginLeft: 16 },
  menuItemDelete: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, marginTop: 10 },
  menuTextDelete: { flex: 1, fontSize: 16, color: '#dc2626', marginLeft: 16, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 8 },
  deleteBox: { backgroundColor: '#fef2f2', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#fca5a5', marginTop: 8 },
  deleteWarnTitle: { fontWeight: 'bold', color: '#991b1b', marginBottom: 8, fontSize: 16 },
  deleteWarnText: { color: '#b91c1c', fontSize: 14, marginBottom: 12 },
  deletePrompt: { color: '#7f1d1d', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#fca5a5', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16, color: '#dc2626', fontWeight: 'bold', textAlign: 'center' },
  btnDelete: { backgroundColor: '#dc2626', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnDeleteText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
