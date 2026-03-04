import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function NewDonationScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [ttl, setTtl] = useState('1');

    const handlePublish = () => {
        // Navigate back to showcase/map after publish for mockup
        router.replace('/(tabs)');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <MaterialIcons name="arrow-back-ios" size={20} color="#003366" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Nova Doação</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* Steps Indicator */}
                    <View style={styles.stepsContainer}>
                        <View style={styles.stepActive}>
                            <View style={styles.stepActiveBar} />
                            <Text style={styles.stepActiveText}>FOTOS</Text>
                        </View>
                        <View style={styles.stepInactiveBar} />
                        <View style={styles.stepInactiveBar} />
                    </View>

                    {/* Photo Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitleCenter}>Adicionar Foto</Text>
                        <Text style={styles.sectionSubtitle}>Mostre para a irmandade o que você deseja doar!</Text>

                        <TouchableOpacity style={styles.photoUploadBox} activeOpacity={0.7}>
                            <View style={styles.camIconWrapper}>
                                <MaterialIcons name="add-a-photo" size={36} color="#fff" />
                            </View>
                            <Text style={styles.uploadTextBold}>Tire uma foto ou escolha da galeria</Text>
                            <Text style={styles.uploadTextHelper}>Até 5 fotos nítidas</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Details Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="edit-note" size={24} color="#003366" />
                            <Text style={styles.sectionTitle}>Detalhes do Item</Text>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>TÍTULO</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: Cesta básica, Terno em bom estado"
                                placeholderTextColor="#94a3b8"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>CATEGORIA</Text>
                            <View style={styles.pickerWrapper}>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Selecione uma categoria"
                                    placeholderTextColor="#94a3b8"
                                    editable={false} // Would use a Picker in real app
                                    value={category}
                                />
                                <MaterialIcons name="expand-more" size={24} color="#94a3b8" style={styles.pickerIcon} />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.label}>DESCRIÇÃO</Text>
                            <TextInput
                                style={styles.textArea}
                                placeholder="Descreva o item, estado de conservação e outras informações..."
                                placeholderTextColor="#94a3b8"
                                multiline
                                textAlignVertical="top"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>
                    </View>

                    {/* Validity Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="history" size={24} color="#003366" />
                            <Text style={styles.sectionTitle}>Prazo de Validade</Text>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ttlScroll}>
                            {['1 Dia', '3 Dias', '5 Dias', '7 Dias'].map((opt, idx) => {
                                const val = opt.split(' ')[0];
                                const isActive = ttl === val;
                                return (
                                    <TouchableOpacity
                                        key={idx}
                                        style={[styles.ttlBtn, isActive && styles.ttlBtnActive]}
                                        onPress={() => setTtl(val)}
                                    >
                                        <Text style={[styles.ttlBtnText, isActive && styles.ttlBtnTextActive]}>{opt}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Location Section */}
                    <View style={styles.locationBox}>
                        <View style={styles.locationInfo}>
                            <View style={styles.locationIconBox}>
                                <MaterialIcons name="location-on" size={24} color="#003366" />
                            </View>
                            <View>
                                <Text style={styles.locationLabel}>LOCAL DE COLETA</Text>
                                <Text style={styles.locationValue}>Capturado Automaticamente</Text>
                            </View>
                        </View>
                        <MaterialIcons name="my-location" size={24} color="#003366" />
                    </View>

                    {/* Publish Button */}
                    <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} activeOpacity={0.8}>
                        <Text style={styles.publishBtnText}>Publicar</Text>
                        <MaterialIcons name="check-circle" size={20} color="#fff" />
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,51,102,0.1)',
        backgroundColor: '#fff',
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,51,102,0.05)'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#003366',
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    stepsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 32,
    },
    stepActive: {
        alignItems: 'center',
        gap: 8,
    },
    stepActiveBar: {
        height: 6,
        width: 48,
        backgroundColor: '#003366',
        borderRadius: 3,
    },
    stepActiveText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#003366',
        letterSpacing: 1,
    },
    stepInactiveBar: {
        height: 6,
        width: 48,
        backgroundColor: '#e2e8f0',
        borderRadius: 3,
        marginBottom: 18, // alignment adjustment
    },
    section: {
        marginBottom: 40,
    },
    sectionTitleCenter: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#003366',
        textAlign: 'center',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#475569',
        textAlign: 'center',
        marginBottom: 24,
    },
    photoUploadBox: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 24,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: 'rgba(0,51,102,0.2)',
        backgroundColor: 'rgba(0,51,102,0.02)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    camIconWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#003366',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#003366',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    uploadTextBold: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#003366',
    },
    uploadTextHelper: {
        fontSize: 12,
        color: '#94a3b8',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#003366',
    },
    formGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748b',
        letterSpacing: 1,
        marginBottom: 6,
        marginLeft: 4,
    },
    input: {
        height: 52,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#0f172a',
    },
    pickerWrapper: {
        justifyContent: 'center',
    },
    pickerIcon: {
        position: 'absolute',
        right: 16,
    },
    textArea: {
        minHeight: 100,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 12,
        fontSize: 15,
        color: '#0f172a',
    },
    ttlScroll: {
        gap: 12,
        paddingBottom: 8,
    },
    ttlBtn: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        backgroundColor: '#fff',
    },
    ttlBtnActive: {
        borderColor: '#003366',
        backgroundColor: '#003366',
    },
    ttlBtnText: {
        fontWeight: 'bold',
        color: '#64748b',
    },
    ttlBtnTextActive: {
        color: '#fff',
    },
    locationBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(0,51,102,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(0,51,102,0.1)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 40,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    locationIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,51,102,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    locationLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
    },
    locationValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#003366',
    },
    publishBtn: {
        flexDirection: 'row',
        height: 56,
        backgroundColor: '#003366',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#003366',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 5,
    },
    publishBtnText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
