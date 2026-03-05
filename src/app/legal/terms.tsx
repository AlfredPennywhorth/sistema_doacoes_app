import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function TermsScreen() {
    const router = useRouter();
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back-ios" size={20} color="#003366" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Termos de Uso</Text>
                <View style={{ width: 40 }} />
            </View>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.updateDate}>Última atualização: 04 de março de 2026</Text>

                <Text style={styles.intro}>
                    Ao utilizar o aplicativo <Text style={styles.bold}>Sistema de Doações</Text>, você
                    concorda com os presentes Termos de Uso. Leia-os atentamente antes de utilizar a
                    plataforma. Estes termos são regidos pelas leis brasileiras, incluindo o{' '}
                    <Text style={styles.bold}>Marco Civil da Internet (Lei nº 12.965/2014)</Text>,
                    a <Text style={styles.bold}>LGPD (Lei nº 13.709/2018)</Text> e o{' '}
                    <Text style={styles.bold}>Código de Defesa do Consumidor (Lei nº 8.078/1990)</Text>.
                </Text>

                <Section title="1. Aceitação">
                    <Text style={styles.body}>
                        O uso do aplicativo implica na aceitação integral e irrevogável dos presentes
                        Termos. Caso não concorde com qualquer disposição, interrompa imediatamente o uso.
                    </Text>
                </Section>

                <Section title="2. Objeto">
                    <Text style={styles.body}>
                        O aplicativo é uma plataforma de intermediação de doações voluntárias entre
                        usuários cadastrados, sem fins lucrativos e sem qualquer vínculo comercial.
                        Nenhuma transação financeira é realizada por meio do sistema.
                    </Text>
                </Section>

                <Section title="3. Cadastro e Responsabilidades do Usuário">
                    <Text style={styles.body}>
                        Para utilizar as funcionalidades, é necessário cadastro com dados verídicos. O
                        usuário é responsável por:{'\n\n'}
                        • Manter suas credenciais em sigilo;{'\n'}
                        • Fornecer informações verdadeiras e atualizadas;{'\n'}
                        • Não utilizar a plataforma para fins ilícitos ou contrários à moral;{'\n'}
                        • Garantir que os itens doados estejam em condições adequadas de uso;{'\n'}
                        • Não anunciar bens ilícitos, produtos falsificados ou perigosos.
                    </Text>
                </Section>

                <Section title="4. Proibições">
                    <Text style={styles.body}>
                        É vedado ao usuário:{'\n\n'}
                        • Publicar informações falsas ou enganosas;{'\n'}
                        • Utilizar a plataforma para prática de atos ilícitos;{'\n'}
                        • Tentar comprometer a segurança, integridade ou disponibilidade do sistema;{'\n'}
                        • Realizar engenharia reversa ou qualquer tentativa de acesso não autorizado.
                    </Text>
                </Section>

                <Section title="5. Isenção de Responsabilidade">
                    <Text style={styles.body}>
                        O aplicativo atua como intermediador e não se responsabiliza por:{'\n\n'}
                        • A qualidade, estado ou adequação dos itens doados;{'\n'}
                        • Transações realizadas fora da plataforma;{'\n'}
                        • Danos causados pela utilização indevida da plataforma por terceiros.
                    </Text>
                </Section>

                <Section title="6. Rescisão">
                    <Text style={styles.body}>
                        O acesso poderá ser suspenso ou encerrado, a qualquer momento e sem aviso
                        prévio, em caso de violação destes Termos ou da legislação vigente.
                    </Text>
                </Section>

                <Section title="7. Foro">
                    <Text style={styles.body}>
                        Para dirimir quaisquer controvérsias oriundas destes Termos, fica eleito o foro
                        da Comarca de São Paulo — SP, com renúncia expressa a qualquer outro, por mais
                        privilegiado que seja.
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
