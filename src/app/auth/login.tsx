import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = () => {
        // Navigate back to the home/map after login for mockup
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                    {/* Top App Bar */}
                    <View style={styles.appBar}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                            <MaterialIcons name="arrow-back-ios" size={20} color="#0f172a" />
                        </TouchableOpacity>
                        <Text style={styles.appBarTitle}>Login</Text>
                        <View style={{ width: 48 }} /> {/* Placeholder to center title */}
                    </View>

                    <View style={styles.headerArea}>
                        {/* Institutional Logo Placeholder */}
                        <View style={styles.logoContainer}>
                            <Image
                                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCUdaGw9gVyxbMAgm9soEM2aXfMhwUpn1X39kIyWC7QIOQrNLk_yvmhK34G9i3vKwi6a7BfS4di5jHVAsQgrXsKecn-fWHfb3y23SoBUQdzAXn579XdDrquW_092sJ-ih77V5HQuqIK0v26nnIrj3sFPW2OFM8g1tqAsjCUXYb0ue6qYnrG05gRvEiliQlm0aSHnfJphVVSsaSqeoKek2gLcoj_eRwsxhev4iobENQZlJErEFMuNZhDnrE-y6khyaEJ5jxotyv5ayM' }}
                                style={styles.logo}
                            />
                        </View>
                        <Text style={styles.title}>Bem-vindo</Text>
                        <Text style={styles.subtitle}>Acesse sua conta para realizar sua contribuição</Text>
                    </View>

                    {/* Login Form */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>E-mail</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="nome@exemplo.com"
                                placeholderTextColor="#94a3b8"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Senha</Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="••••••••"
                                    placeholderTextColor="#94a3b8"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity style={styles.visibilityBtn} onPress={() => setShowPassword(!showPassword)}>
                                    <MaterialIcons name={showPassword ? "visibility-off" : "visibility"} size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity style={styles.forgotPassword}>
                                <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.8}>
                            <Text style={styles.loginBtnText}>Entrar</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OU ENTRAR COM</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Social Login */}
                    <View style={styles.socialContainer}>
                        <TouchableOpacity style={styles.socialBtn}>
                            <FontAwesome5 name="google" size={18} color="#db4437" />
                            <Text style={styles.socialBtnText}>Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.socialBtn}>
                            <FontAwesome5 name="apple" size={20} color="#000" />
                            <Text style={styles.socialBtnText}>Apple</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Não tem uma conta? </Text>
                        <TouchableOpacity onPress={() => router.push('/auth/register')}>
                            <Text style={styles.footerLink}>Cadastre-se</Text>
                        </TouchableOpacity>
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
        justifyContent: 'center',
    },
    appBarTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    headerArea: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 32,
    },
    logoContainer: {
        width: 96,
        height: 96,
        backgroundColor: '#143db8',
        borderRadius: 24,
        marginBottom: 24,
        overflow: 'hidden',
        shadowColor: '#143db8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    logo: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#0f172a',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        color: '#475569',
        marginTop: 8,
        textAlign: 'center',
    },
    formContainer: {
        paddingHorizontal: 24,
        gap: 16,
    },
    inputGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0f172a',
        marginLeft: 4,
    },
    input: {
        height: 56,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#0f172a',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        height: 56,
    },
    passwordInput: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#0f172a',
    },
    visibilityBtn: {
        paddingHorizontal: 16,
        height: '100%',
        justifyContent: 'center',
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    forgotPasswordText: {
        color: '#143db8',
        fontSize: 14,
        fontWeight: '500',
    },
    loginBtn: {
        height: 56,
        backgroundColor: '#143db8',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#143db8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    loginBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        marginVertical: 32,
        gap: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e2e8f0',
    },
    dividerText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    socialContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 16,
    },
    socialBtn: {
        flex: 1,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        gap: 8,
    },
    socialBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#334155',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        paddingBottom: 40,
        paddingTop: 24,
    },
    footerText: {
        color: '#475569',
        fontSize: 14,
    },
    footerLink: {
        color: '#143db8',
        fontSize: 14,
        fontWeight: 'bold',
    }
});
