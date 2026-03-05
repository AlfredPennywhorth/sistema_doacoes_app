import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function PrivacyScreen() {
    const router = useRouter();
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#003366" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Política de Privacidade</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.updateDate}>Última atualização: 04 de março de 2026</Text>

                <Text style={styles.intro}>
                    Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e
                    protegemos seus dados pessoais, em conformidade com a{' '}
                    <Text style={styles.bold}>Lei Geral de Proteção de Dados — LGPD (Lei nº 13.709/2018)</Text>.
                </Text>

                <Section title="1. Controlador dos Dados">
                    <Text style={styles.body}>
                        O controlador dos dados pessoais é o titular do aplicativo Sistema de Doações.
                        Para exercer seus direitos ou tirar dúvidas, entre em contato pelo e-mail
                        disponibilizado na tela de suporte do aplicativo.
                    </Text>
                </Section>

                <Section title="2. Dados Coletados">
                    <Text style={styles.body}>
                        Coletamos os seguintes dados fornecidos voluntariamente pelo usuário:{'\n\n'}
                        • <Text style={styles.bold}>Dados de cadastro:</Text> nome completo, e-mail e telefone;{'\n'}
                        • <Text style={styles.bold}>Dados de localização:</Text> coordenadas GPS capturadas apenas no momento de publicar uma doação, com sua permissão explícita;{'\n'}
                        • <Text style={styles.bold}>Dados de uso:</Text> doações publicadas, reservadas e histórico de atividade.{'\n\n'}
                        Nenhum dado sensível (art. 5º, II, LGPD) é coletado.
                    </Text>
                </Section>

                <Section title="3. Finalidade do Tratamento">
                    <Text style={styles.body}>
                        Seus dados são utilizados exclusivamente para:{'\n\n'}
                        • Autenticação e gerenciamento da sua conta;{'\n'}
                        • Exibição de doações disponíveis próximas a você;{'\n'}
                        • Comunicação entre doadores e recebedores;{'\n'}
                        • Melhoria contínua das funcionalidades do aplicativo.
                    </Text>
                </Section>

                <Section title="4. Base Legal">
                    <Text style={styles.body}>
                        O tratamento de dados é realizado com base no{' '}
                        <Text style={styles.bold}>consentimento do titular (art. 7º, I, LGPD)</Text>,
                        fornecido no ato do cadastro, e no{' '}
                        <Text style={styles.bold}>legítimo interesse (art. 7º, IX, LGPD)</Text> para
                        o funcionamento da plataforma.
                    </Text>
                </Section>

                <Section title="5. Compartilhamento de Dados">
                    <Text style={styles.body}>
                        Seus dados <Text style={styles.bold}>não são vendidos ou compartilhados</Text>{' '}
                        com terceiros para fins comerciais. Utilizamos o serviço{' '}
                        <Text style={styles.bold}>Supabase</Text> como infraestrutura de banco de dados
                        e autenticação, que possui conformidade com padrões internacionais de segurança
                        (SOC 2 Type II).
                    </Text>
                </Section>

                <Section title="6. Retenção e Exclusão">
                    <Text style={styles.body}>
                        Seus dados são retidos enquanto sua conta estiver ativa. Ao solicitar a exclusão
                        da conta, todos os dados pessoais serão removidos em até{' '}
                        <Text style={styles.bold}>30 dias</Text>, conforme art. 16 da LGPD, salvo
                        obrigação legal de retenção.
                    </Text>
                </Section>

                <Section title="7. Seus Direitos (Art. 18, LGPD)">
                    <Text style={styles.body}>
                        Você tem direito a:{'\n\n'}
                        • Confirmar a existência e acessar seus dados;{'\n'}
                        • Corrigir dados incompletos, inexatos ou desatualizados;{'\n'}
                        • Solicitar a anonimização, bloqueio ou eliminação dos dados;{'\n'}
                        • Revogar o consentimento a qualquer momento;{'\n'}
                        • Portabilidade dos dados, quando aplicável.{'\n\n'}
                        Para exercer qualquer um desses direitos, entre em contato pelo suporte do
                        aplicativo.
                    </Text>
                </Section>

                <Section title="8. Segurança">
                    <Text style={styles.body}>
                        Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados
                        contra acesso não autorizado, alteração, divulgação ou destruição, em
                        conformidade com o art. 46 da LGPD.
                    </Text>
                </Section>

                <Section title="9. Cookies e Tecnologias de Rastreamento">
                    <Text style={styles.body}>
                        O aplicativo não utiliza cookies de rastreamento publicitário. Eventuais tokens
                        de sessão são utilizados exclusivamente para autenticação segura.
                    </Text>
                </Section>

                <Section title="10. Alterações desta Política">
                    <Text style={styles.body}>
                        Podemos atualizar esta Política periodicamente. Você será notificado sobre
                        mudanças relevantes pelo aplicativo. O uso continuado após as alterações
                        constitui aceite das novas condições.
                    </Text>
                </Section>
            </ScrollView>
        </SafeAreaView>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f5f9' },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#003366' },
    content: { padding: 20, paddingBottom: 48 },
    updateDate: { fontSize: 12, color: '#94a3b8', marginBottom: 16 },
    intro: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 20 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#003366', marginBottom: 8 },
    body: { fontSize: 14, color: '#334155', lineHeight: 22 },
    bold: { fontWeight: 'bold', color: '#003366' },
});
