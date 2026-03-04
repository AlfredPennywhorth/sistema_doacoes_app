import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ListScreen() {
    const donations = [
        {
            id: '1',
            category: 'Alimentos',
            distance: '0.4 km',
            title: 'Cesta de Vegetais Orgânicos',
            desc: 'Tomates frescos, pepinos e verduras variadas...',
            posted: 'Postado há 2h',
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2Nz2FaLDc9FjmMqCgnh1245qSrKKlr3PngmX70Oii2j7rpU7bb2asqg-bKaORpvqlkz0MaboQ_WeLZgK_ejB0EmdPRBE-OZsVewpX13URNDGtkQeqa4-nKbFJa5wRTLtyVPyF8zFKET7y4kjTvOGdXng7tX8Eby21dWPiYWn1BQzzpYOHVKYbQxZDwmWxM8M6VCzrdhYLph367oFvlCjiotCddsn55zckTPHRfNKRzW_vt3Zqw8vZydOmFkAVIxu6eoy9Nb-igsw'
        },
        {
            id: '2',
            category: 'Vestuário',
            distance: '1.2 km',
            title: 'Casacos de Inverno',
            desc: 'Tamanhos variados para adultos, em ótimo estado...',
            posted: 'Postado há 5h',
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9ncctK-UndtgTe1tTlQmCNMzkyiE7Av-FR4xKyHVQVUtBRTGQIz5dF1qS_nZQHEm8hmPMNyik9c3_lhZwPVVekqez4VHEaZyrSM7tDL4ZMnmWZPq0auCs6azArHfKxzhDm7Erh_sfVYmBh1xoUsOJbXnTwvDh8uvSPM9IoxTDS7SuZgmZtoodAWhZHOzJ4n2zgiW0i7j6jb6__MWcoQj4BoXK1D1wyOAbfRcoEJgyLwn4LGK-yDam1YtGgSPejddGtHmfrHdtL18'
        },
        {
            id: '3',
            category: 'Móveis',
            distance: '2.5 km',
            title: 'Cadeira de Escritório',
            desc: 'Funcionando perfeitamente, com rodinhas...',
            posted: 'Postado há 8h',
            img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDV4BEh7T8gqgt6OahusK_ZsBZ8E7tc57KNb4oWNByHjNifMJDpSbT5RI7oJ3I24t-RFMbi4j6LMDNqKynR3Xvax_8wlIxUV9QkBNRpgB8p-hQD_WIiJ6ePxIkBwOk0qwmhJ0rMt9uEFX4ZPNdFb1lEwa-5RNswZOr66XZ_nPV8e0hh6zXS6Pp7KPbPdvnEYU91NcAkN0IXTOuOyMBAxpIq0MbpXTwX1yMgoE8R-FIfzKb78-uKjoW6x3cWWvGSCsRTuVtcF3S3KRA'
        }
    ];

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.headerBtn}>
                        <MaterialIcons name="menu" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Vitrine de Itens</Text>
                    <TouchableOpacity style={styles.headerBtn}>
                        <MaterialIcons name="search" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* View Toggle */}
                <View style={styles.viewToggleContainer}>
                    <View style={styles.toggleBg}>
                        <TouchableOpacity style={[styles.toggleBtn, styles.toggleBtnActive]}>
                            <MaterialIcons name="view-list" size={18} color="#1a365d" style={{ marginRight: 4 }} />
                            <Text style={styles.toggleTextActive}>Lista</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.toggleBtn}>
                            <MaterialIcons name="map" size={18} color="#64748b" style={{ marginRight: 4 }} />
                            <Text style={styles.toggleText}>Ver no Mapa</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Categories Tags */}
                <View style={styles.tagsContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
                        <TouchableOpacity style={[styles.tag, styles.tagActive]}>
                            <Text style={styles.tagTextActive}>TODOS</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.tag}>
                            <Text style={styles.tagText}>ALIMENTOS</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.tag}>
                            <Text style={styles.tagText}>VESTUÁRIO</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.tag}>
                            <Text style={styles.tagText}>MÓVEIS</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>

                {/* List Content */}
                <ScrollView style={styles.listContainer} contentContainerStyle={styles.listContent}>
                    {donations.map((item) => (
                        <TouchableOpacity key={item.id} style={styles.card} activeOpacity={0.8}>
                            <View style={styles.cardImgBox}>
                                <Image source={{ uri: item.img }} style={styles.cardImg} />
                            </View>
                            <View style={styles.cardInfo}>
                                <View style={styles.cardHeader}>
                                    <Text style={styles.cardCategory}>Categoria • {item.category}</Text>
                                    <View style={styles.distanceBadge}>
                                        <MaterialIcons name="my-location" size={10} color="#1a365d" />
                                        <Text style={styles.distanceText}>{item.distance}</Text>
                                    </View>
                                </View>
                                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                                <Text style={styles.cardDesc} numberOfLines={1}>{item.desc}</Text>

                                <View style={styles.cardFooter}>
                                    <Text style={styles.postedText}>{item.posted}</Text>
                                    <View style={styles.detailsBtn}>
                                        <Text style={styles.detailsBtnText}>VER DETALHES</Text>
                                    </View>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}

                    <View style={{ height: 100 }} />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#1a365d',
    },
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        backgroundColor: '#1a365d',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    headerBtn: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    viewToggleContainer: {
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    toggleBg: {
        flexDirection: 'row',
        height: 44,
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        padding: 4,
    },
    toggleBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
    },
    toggleBtnActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.5)',
    },
    toggleTextActive: {
        color: '#1a365d',
        fontSize: 14,
        fontWeight: 'bold',
    },
    toggleText: {
        color: '#64748b',
        fontSize: 14,
        fontWeight: '600',
    },
    tagsContainer: {
        backgroundColor: '#fff',
        paddingVertical: 12,
    },
    tagsScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    tag: {
        height: 32,
        paddingHorizontal: 16,
        backgroundColor: '#f8fafc',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tagActive: {
        backgroundColor: '#1a365d',
        borderColor: '#1a365d',
    },
    tagText: {
        color: '#475569',
        fontSize: 10,
        fontWeight: 'bold',
    },
    tagTextActive: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    listContainer: {
        flex: 1,
        backgroundColor: 'rgba(248, 250, 252, 0.5)',
    },
    listContent: {
        padding: 16,
        gap: 12,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    cardImgBox: {
        width: 96,
        height: 96,
        borderRadius: 8,
        backgroundColor: '#f1f5f9',
        overflow: 'hidden',
    },
    cardImg: {
        width: '100%',
        height: '100%',
    },
    cardInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    cardCategory: {
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: 'rgba(26, 54, 93, 0.7)',
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        gap: 2,
    },
    distanceText: {
        color: '#1a365d',
        fontSize: 9,
        fontWeight: 'bold',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1a365d',
        marginBottom: 2,
    },
    cardDesc: {
        fontSize: 11,
        color: '#64748b',
        marginBottom: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    postedText: {
        fontSize: 9,
        color: '#94a3b8',
        fontWeight: '600',
    },
    detailsBtn: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(26, 54, 93, 0.2)',
        paddingBottom: 2,
    },
    detailsBtnText: {
        color: '#1a365d',
        fontSize: 10,
        fontWeight: 'bold',
    }
});
