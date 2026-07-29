import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { generateAvatarUrl } from '../utils/avatarGenerator';

export interface UserAvatarProps {
  name?: string;
  userId?: string;
  imageUrl?: string | null;
  size?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ name, userId, imageUrl, size = 40 }) => {
  const [imgError, setImgError] = useState(false);
  
  // Try stable seed (userId), fallback to name, fallback to generic
  const seed = userId || name || 'default-seed';
  
  const getInitials = (n?: string) => {
    if (!n) return '?';
    const parts = n.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n.substring(0, 2).toUpperCase();
  };

  if (imgError) {
    // Fallback local caso tudo falhe (sem internet, API fora)
    return (
      <View style={[styles.fallbackContainer, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>{getInitials(name)}</Text>
      </View>
    );
  }

  // Prioriza imagem do Supabase (se existir), senão usa DiceBear
  const sourceUrl = imageUrl ? imageUrl : generateAvatarUrl(seed, { size, radius: 50, backgroundColor: 'E6F4FE' });

  return (
    <Image
      source={{ uri: sourceUrl }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      contentFit="cover"
      transition={200}
      onError={() => setImgError(true)}
    />
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: '#0284c7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackText: {
    color: '#ffffff',
    fontWeight: 'bold',
  }
});
