import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type HelpSectionProps = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  summary: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
};

function HelpSection({
  icon,
  title,
  summary,
  children,
  initiallyOpen = false,
}: HelpSectionProps) {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${open ? 'Recolher' : 'Expandir'} instruções`}
      >
        <View style={styles.sectionIcon}>
          <MaterialIcons name={icon} size={22} color="#003366" />
        </View>
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSummary}>{summary}</Text>
        </View>
        <MaterialIcons
          name={open ? 'expand-less' : 'expand-more'}
          size={24}
          color="#64748b"
        />
      </TouchableOpacity>

      {open && <View style={styles.sectionBody}>{children}</View>}
    </View>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.bodyText}>{children}</Text>
      </View>
    </View>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.tip}>
      <MaterialIcons name="lightbulb-outline" size={20} color="#92400e" />
      <Text style={styles.tipText}>{children}</Text>
    </View>
  );
}

export default function HelpScreen() {
  const router = useRouter();
  const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;

  const contactSupport = () => {
    if (!supportEmail) return;

    const subject = encodeURIComponent('Ajuda - Sistema de Doações');
    Linking.openURL(`mailto:${supportEmail}?subject=${subject}`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <MaterialIcons name="arrow-back-ios" size={20} color="#003366" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Central de Ajuda</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialIcons name="volunteer-activism" size={34} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Como usar o Sistema de Doações</Text>
          <Text style={styles.heroText}>
            Um guia rápido para doar, encontrar itens, fazer pedidos e concluir
            uma retirada com segurança.
          </Text>
        </View>

        <View style={styles.quickGuide}>
          <Text style={styles.quickTitle}>Em poucos passos</Text>
          <View style={styles.quickRow}>
            <View style={styles.quickItem}>
              <MaterialIcons name="person-add" size={24} color="#003366" />
              <Text style={styles.quickItemTitle}>1. Cadastre-se</Text>
              <Text style={styles.quickItemText}>Use nome, e-mail e senha.</Text>
            </View>
            <View style={styles.quickItem}>
              <MaterialIcons name="search" size={24} color="#003366" />
              <Text style={styles.quickItemTitle}>2. Explore</Text>
              <Text style={styles.quickItemText}>Veja mapa, vitrine e pedidos.</Text>
            </View>
            <View style={styles.quickItem}>
              <MaterialIcons name="handshake" size={24} color="#003366" />
              <Text style={styles.quickItemTitle}>3. Conecte-se</Text>
              <Text style={styles.quickItemText}>Doe ou reserve um item.</Text>
            </View>
          </View>
        </View>

        <HelpSection
          icon="explore"
          title="Conheça as telas principais"
          summary="Mapa, Vitrine e Pedidos"
          initiallyOpen
        >
          <Step number={1} title="Mapa">
            Veja onde existem doações próximas. O mapa mostra somente uma
            localização pública aproximada, nunca o endereço residencial exato.
          </Step>
          <Step number={2} title="Vitrine">
            Consulte todos os itens disponíveis, filtre por categoria ou local e
            toque em um item para ver os detalhes.
          </Step>
          <Step number={3} title="Pedidos">
            Acompanhe itens reservados para você, suas próprias doações e pedidos
            publicados pela comunidade.
          </Step>
        </HelpSection>

        <HelpSection
          icon="add-circle-outline"
          title="Como publicar uma doação"
          summary="Cadastre um item e escolha como será a retirada"
        >
          <Step number={1} title="Abra a Vitrine">
            Toque no botão + para iniciar uma nova doação.
          </Step>
          <Step number={2} title="Descreva o item">
            Informe categoria, título, descrição e fotos que ajudem a identificar
            corretamente o que está sendo oferecido.
          </Step>
          <Step number={3} title="Escolha o local">
            Você pode encaminhar o item para um galpão disponível ou escolher
            retirada no seu endereço.
          </Step>
          <Step number={4} title="Revise e publique">
            Confira os dados antes de tocar em Publicar. Marque retirada urgente
            apenas quando realmente necessário.
          </Step>
          <Tip>
            Em retirada residencial, o endereço exato fica protegido. O mapa usa
            somente coordenadas públicas aproximadas.
          </Tip>
        </HelpSection>

        <HelpSection
          icon="shopping-bag"
          title="Como reservar uma doação"
          summary="Escolha um item e combine a retirada"
        >
          <Step number={1} title="Encontre o item">
            Use o Mapa ou a Vitrine e abra os detalhes da doação.
          </Step>
          <Step number={2} title="Reserve">
            Se o item estiver disponível, toque em Reservar Agora.
          </Step>
          <Step number={3} title="Combine a retirada">
            Depois da reserva, os dados necessários para a retirada ficam
            disponíveis para você. Quando houver telefone cadastrado, use o
            WhatsApp para combinar data e horário.
          </Step>
          <Step number={4} title="Se desistir">
            Use a opção Desistir da Reserva para liberar o item para outra pessoa.
          </Step>
          <Tip>
            Não se desloque antes de confirmar a retirada com o doador.
          </Tip>
        </HelpSection>

        <HelpSection
          icon="assignment"
          title="Como publicar um pedido"
          summary="Informe um item que você precisa"
        >
          <Step number={1} title="Abra Pedidos">
            Entre na aba Pedidos e escolha a opção para criar um novo pedido.
          </Step>
          <Step number={2} title="Seja objetivo">
            Escolha a categoria, informe um título claro e descreva a necessidade.
          </Step>
          <Step number={3} title="Publique">
            Toque em Postar Pedido. O pedido ficará visível para pessoas que
            possam oferecer um item compatível.
          </Step>
          <Tip>
            Evite inserir endereço, documentos ou outros dados pessoais na
            descrição pública do pedido.
          </Tip>
        </HelpSection>

        <HelpSection
          icon="check-circle-outline"
          title="Como concluir uma retirada"
          summary="Finalize corretamente a doação"
        >
          <Step number={1} title="Agende">
            Doador e recebedor combinam a retirada pelos canais disponibilizados
            após a reserva.
          </Step>
          <Step number={2} title="Entregue o item">
            Faça a entrega somente à pessoa que reservou a doação.
          </Step>
          <Step number={3} title="Confirme no aplicativo">
            Após a entrega, o doador deve usar Confirmar Retirada. Isso encerra a
            doação e atualiza o status do item.
          </Step>
        </HelpSection>

        <HelpSection
          icon="privacy-tip"
          title="Privacidade e segurança"
          summary="O que fica público e o que permanece protegido"
        >
          <View style={styles.bulletRow}>
            <MaterialIcons name="check" size={18} color="#047857" />
            <Text style={styles.bodyText}>
              O mapa utiliza localização aproximada para residências.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <MaterialIcons name="check" size={18} color="#047857" />
            <Text style={styles.bodyText}>
              O endereço exato de retirada é restrito aos envolvidos no fluxo.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <MaterialIcons name="check" size={18} color="#047857" />
            <Text style={styles.bodyText}>
              Permissões de localização e fotos são solicitadas somente quando
              necessárias para uma ação escolhida pelo usuário.
            </Text>
          </View>
          <View style={styles.bulletRow}>
            <MaterialIcons name="check" size={18} color="#047857" />
            <Text style={styles.bodyText}>
              Em Configurações você encontra a Política de Privacidade, Termos de
              Uso e a opção de excluir sua conta.
            </Text>
          </View>
        </HelpSection>

        <HelpSection
          icon="build"
          title="Se algo não funcionar"
          summary="Soluções rápidas para os problemas mais comuns"
        >
          <Text style={styles.faqTitle}>Não aparecem itens na tela</Text>
          <Text style={styles.bodyText}>
            Verifique sua conexão, remova filtros muito específicos e atualize a
            tela.
          </Text>

          <Text style={styles.faqTitle}>Não consigo usar minha localização</Text>
          <Text style={styles.bodyText}>
            Verifique se a permissão de localização foi autorizada nas
            configurações do aparelho ou navegador. Você também pode informar o
            endereço manualmente quando o fluxo permitir.
          </Text>

          <Text style={styles.faqTitle}>Não consigo adicionar uma foto</Text>
          <Text style={styles.bodyText}>
            Confirme a permissão de acesso às fotos ou câmera e tente novamente.
          </Text>

          <Text style={styles.faqTitle}>Reservei por engano</Text>
          <Text style={styles.bodyText}>
            Abra o item reservado e use Desistir da Reserva para devolvê-lo à
            disponibilidade.
          </Text>
        </HelpSection>

        <View style={styles.supportCard}>
          <MaterialIcons name="support-agent" size={28} color="#003366" />
          <View style={styles.supportText}>
            <Text style={styles.supportTitle}>Ainda precisa de ajuda?</Text>
            <Text style={styles.supportDescription}>
              Entre em contato com o suporte do Sistema de Doações.
            </Text>
          </View>
          {supportEmail ? (
            <TouchableOpacity
              style={styles.supportButton}
              onPress={contactSupport}
              accessibilityRole="button"
              accessibilityLabel="Enviar e-mail para o suporte"
            >
              <MaterialIcons name="email" size={20} color="#fff" />
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.footerNote}>
          Este guia acompanha o funcionamento atual do aplicativo e poderá ser
          atualizado conforme novos recursos forem disponibilizados.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  content: { padding: 16, paddingBottom: 40 },
  hero: {
    backgroundColor: '#003366',
    borderRadius: 20,
    padding: 22,
    marginBottom: 16,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  quickGuide: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  quickTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickItem: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    minHeight: 116,
  },
  quickItemTitle: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  quickItemText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: '#64748b',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#eaf2f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeading: { flex: 1, marginHorizontal: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  sectionSummary: { marginTop: 3, fontSize: 12, color: '#64748b' },
  sectionBody: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    padding: 15,
    gap: 12,
  },
  step: { flexDirection: 'row', alignItems: 'flex-start' },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  stepNumberText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  bodyText: { marginTop: 3, fontSize: 13, color: '#475569', lineHeight: 19, flex: 1 },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    backgroundColor: '#fffbeb',
    borderRadius: 10,
  },
  tipText: { flex: 1, color: '#92400e', fontSize: 13, lineHeight: 18 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  faqTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginTop: 4 },
  supportCard: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#eaf2f8',
  },
  supportText: { flex: 1, marginHorizontal: 12 },
  supportTitle: { fontSize: 15, fontWeight: '700', color: '#003366' },
  supportDescription: { marginTop: 3, fontSize: 12, color: '#475569' },
  supportButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerNote: {
    marginTop: 18,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
  },
});
