import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

export default function DeleteAccountWebScreen() {
  const handleEmailRequest = () => {
    const subject = encodeURIComponent('Solicitação de Exclusão de Conta - Sistema de Doações');
    const body = encodeURIComponent('Olá,\n\nGostaria de solicitar a exclusão da minha conta e de todos os meus dados vinculados ao aplicativo Sistema de Doações.\n\nE-mail da conta: [SEU EMAIL AQUI]\n\nAguardo a confirmação da exclusão.');
    Linking.openURL(`mailto:suporte@sistemadoacoes.com?subject=${subject}&body=${body}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerBox}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <MaterialIcons name="delete-forever" size={64} color="#dc2626" style={{ alignSelf: 'center', marginBottom: 16 }} />
          <Text style={styles.title}>Exclusão de Conta</Text>
          
          <Text style={styles.text}>
            Se você deseja excluir a sua conta do aplicativo **Sistema de Doações** e remover os seus dados dos nossos servidores, você possui duas opções:
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Opção 1: Pelo Aplicativo (Recomendado)</Text>
            <Text style={styles.text}>
              1. Abra o aplicativo e faça o login.
              2. Acesse a tela do mapa e clique na sua foto/ícone de **Perfil / Configurações**.
              3. Clique em **Excluir minha conta**.
              4. Digite "EXCLUIR" e confirme. Os dados serão removidos imediatamente.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Opção 2: Por E-mail</Text>
            <Text style={styles.text}>
              Caso não tenha mais o aplicativo instalado, você pode solicitar a exclusão enviando um e-mail para nossa equipe de suporte. 
              {'\n\n'}
              **O que será excluído:**
              - Seu nome, e-mail e telefone de cadastro.
              - Informações exatas de endereço (residência para retirada).
              - Fotos e imagens pessoais (como fotos do perfil e de doações excluídas).
              - Suas credenciais de login.
              {'\n\n'}
              *Algumas doações e reservas já concluídas podem ser mantidas de forma anonimizada para histórico da plataforma.*
            </Text>
            
            <TouchableOpacity style={styles.btn} onPress={handleEmailRequest}>
              <MaterialIcons name="email" size={20} color="#fff" />
              <Text style={styles.btnText}>Solicitar exclusão por e-mail</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', alignItems: 'center' },
  centerBox: {
    width: '100%',
    maxWidth: 600,
    flex: 1,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  scroll: {
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 24,
  },
  text: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
