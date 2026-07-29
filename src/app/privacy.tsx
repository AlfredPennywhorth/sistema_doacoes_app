import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrivacyPolicyContent } from '../components/legal/PrivacyPolicyContent';

// Rota pública para web (/privacy)
export default function PublicPrivacyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerBox}>
        <PrivacyPolicyContent />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', alignItems: 'center' },
  centerBox: {
    width: '100%',
    maxWidth: 800,
    flex: 1,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  }
});
