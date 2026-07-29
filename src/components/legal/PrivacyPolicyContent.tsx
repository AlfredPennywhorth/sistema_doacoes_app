import React from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";

export const PrivacyPolicyContent = () => {
  const supportEmail = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Política de Privacidade</Text>

      <Text style={styles.text}>
        O Sistema de Doações tem como finalidade conectar pessoas interessadas
        em doar a pessoas em necessidade. Ao utilizar o aplicativo, você
        concorda com a coleta e o uso das suas informações conforme estabelecido
        nesta política.
      </Text>

      <Text style={styles.heading}>1. Dados Coletados</Text>
      <Text style={styles.text}>
        - **Dados Pessoais**: Nome, e-mail e telefone informados durante o
        cadastro. - **Conteúdo Gerado**: Títulos, descrições e fotos de doações
        publicadas. - **Localização**: - **Aproximada**: As coordenadas públicas
        exibidas no mapa limitam-se ao nível de precisão de bairro/região. -
        **Exata**: O endereço residencial só é solicitado durante a publicação
        de uma doação para retirada no local, ficando isolado e restrito apenas
        a usuários com reservas confirmadas ou administradores.
      </Text>

      <Text style={styles.heading}>2. Serviços de Terceiros e APIs</Text>
      <Text style={styles.text}>
        Utilizamos os seguintes serviços: - **BrasilAPI e ViaCEP**: Para busca
        de endereços através do CEP. - **IBGE**: Para carregamento de estados e
        cidades do Brasil. - **OpenStreetMap / Nominatim**: Apenas consultado no
        servidor (Edge Function) para converter endereços em coordenadas, sem
        vínculo direto com o perfil. - **DiceBear**: Geração de avatares
        automáticos. - **Google Maps**: Para a renderização do mapa no
        dispositivo móvel. - **Supabase**: Nosso provedor de autenticação e
        banco de dados em nuvem.
      </Text>

      <Text style={styles.heading}>3. Finalidade e Retenção</Text>
      <Text style={styles.text}>
        Os dados são mantidos enquanto a conta estiver ativa. Ao excluir a
        conta, removemos os dados pessoais, pedidos, reservas, itens e imagens
        vinculadas ao usuário. Dados sensíveis (como endereço de retirada
        privado) são protegidos via RLS (Row Level Security) e restritos apenas
        a partes envolvidas na doação.
      </Text>

      <Text style={styles.heading}>4. Exclusão de Conta</Text>
      <Text style={styles.text}>
        Você pode solicitar a exclusão da sua conta a qualquer momento na tela
        de **Configurações** do aplicativo, ou externamente através do nosso
        site de exclusão. A exclusão removerá dados pessoais, imagens submetidas
        e informações privadas.
      </Text>

      <Text style={styles.heading}>5. Contato</Text>
      <Text style={styles.text}>
        Em caso de dúvidas ou para exercer seus direitos, entre em contato
        através do e-mail oficial do projeto:
      </Text>
      {supportEmail ? (
        <Text
          style={styles.link}
          onPress={() => Linking.openURL(`mailto:${supportEmail}`)}
        >
          {supportEmail}
        </Text>
      ) : (
        <Text style={styles.text}>
          E-mail de contato não configurado neste ambiente.
        </Text>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 20,
  },
  heading: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 20,
    marginBottom: 10,
  },
  text: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
  },
  link: {
    fontSize: 15,
    color: "#0284c7",
    fontWeight: "bold",
    marginTop: 5,
    textDecorationLine: "underline",
  },
});
