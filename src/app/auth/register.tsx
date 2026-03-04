import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function RegisterScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = () => {
        // Navigate back to the home/map after register for mockup
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {/* TopApp Bar */}
                    <View style={styles.appBar}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <MaterialIcons name="arrow-back" size={24} color="#0f172a" />
                        </TouchableOpacity>
                        <Text style={styles.appBarTitle}>Cadastro</Text>
                        <View style={{ width: 48 }} />
                    </View>

                    <View style={styles.headerArea}>
                        <Text style={styles.title}>Crie sua conta</Text>
                        <Text style={styles.subtitle}>Preencha os dados abaixo para começar a contribuir com as obras da CCB.</Text>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formContainer}>
                        {/* Nome Completo */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nome Completo</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialIcons name="person" size={20} color="#94a3b8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Seu nome completo"
                                    placeholderTextColor="#94a3b8"
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        </View>

                        {/* E-mail */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>E-mail</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialIcons name="mail" size={20} color="#94a3b8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="exemplo@email.com"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    value={email}
                                    onChangeText={setEmail}
                                />
                            </View>
                        </View>

                        {/* Telefone */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Telefone</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialIcons name="call" size={20} color="#94a3b8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="(00) 00000-0000"
                                    placeholderTextColor="#94a3b8"
                                    keyboardType="phone-pad"
                                    value={phone}
                                    onChangeText={setPhone}
                                />
                            </View>
                        </View>

                        {/* Senha */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Senha</Text>
                            <View style={styles.inputWrapper}>
                                <MaterialIcons name="lock" size={20} color="#94a3b8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Crie uma senha forte"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity style={styles.visibilityBtn} onPress={() => setShowPassword(!showPassword)}>
                                    <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} activeOpacity={0.8}>
                            <Text style={styles.registerBtnText}>Criar Conta</Text>
                        </TouchableOpacity>
                        <Text style={styles.termsText}>
                            Ao se cadastrar, você concorda com nossos{'\n'}
                            <Text style={styles.termsLink}>Termos de Uso</Text> e <Text style={styles.termsLink}>Privacidade</Text>.
                        </Text>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f6f6f8',
    },
    scrollContent: {
        flexGrow: 1,
        minHeight: '100%',
    },
    appBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appBarTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    headerArea: {
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#475569',
        marginTop: 8,
        lineHeight: 24,
    },
    formContainer: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        height: 56,
    },
    inputIcon: {
        paddingLeft: 16,
        paddingRight: 8,
    },
    input: {
        flex: 1,
        height: '100%',
        paddingRight: 16,
        fontSize: 16,
        color: '#0f172a',
    },
    passwordInput: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#0f172a',
    },
    visibilityBtn: {
        paddingHorizontal: 16,
        height: '100%',
        justifyContent: 'center',
    },
    footer: {
        marginTop: 'auto',
        paddingHorizontal: 24,
        paddingVertical: 32,
        gap: 16,
    },
    registerBtn: {
        height: 56,
        backgroundColor: '#0f2cbd', // CCB blue variant
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0f2cbd',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    registerBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    termsText: {
        textAlign: 'center',
        color: '#475569',
        fontSize: 14,
        lineHeight: 22,
    },
    termsLink: {
        color: '#0f2cbd',
        fontWeight: '600',
        textDecorationLine: 'underline',
    }
});
