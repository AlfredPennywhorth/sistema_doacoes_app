import { getAppConfig } from '@/services/databaseService';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

export const UpdateHandler = () => {
    const isVersionLower = (current: string, latest: string) => {
        const v1 = current.split('.').map(Number);
        const v2 = latest.split('.').map(Number);

        for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
            const num1 = v1[i] || 0;
            const num2 = v2[i] || 0;
            if (num1 < num2) return true;
            if (num1 > num2) return false;
        }
        return false;
    };

    const showUpdateAlert = (url: string, required: boolean) => {
        const buttons: any[] = [
            {
                text: 'Baixar Agora',
                onPress: () => Linking.openURL(url)
            }
        ];

        if (!required) {
            buttons.push({
                text: 'Depois',
                style: 'cancel',
                onPress: () => { }
            });
        }

        Alert.alert(
            'Nova Versão Disponível',
            required
                ? 'Uma atualização obrigatória é necessária para continuar usando o aplicativo.'
                : 'Existe uma nova versão com melhorias. Deseja baixar o novo instalador?',
            buttons,
            { cancelable: !required }
        );
    };

    const [retryCount, setRetryCount] = useState(0);
    const checkUpdate = React.useCallback(async () => {
        if (retryCount >= 3) return; // Limita a 3 tentativas por sessão para economizar recursos

        try {
            // Pega a versão atual definida no app.json / package.json
            const currentVersion = Constants.expoConfig?.version || '1.0.0';
            const platformKey = Platform.OS === 'android' ? 'android_version' : 'ios_version';

            // Adiciona um timeout de 5s para evitar bloqueio infinito se a rede falhar
            const configPromise = getAppConfig(platformKey);
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Timeout ao buscar config')), 5000)
            );

            const config = await Promise.race([configPromise, timeoutPromise]) as any;

            if (config && config.version) {
                if (isVersionLower(currentVersion, config.version)) {
                    showUpdateAlert(config.url, config.required);
                }
            }
        } catch (error) {
            console.error('[UpdateHandler] Erro ao verificar update:', error);
            setRetryCount(prev => prev + 1);
        }
    }, [retryCount]);

    useEffect(() => {
        const timer = setTimeout(() => {
            checkUpdate();
        }, 3000); // Aguarda 3 segundos após o boot para não competir com o render inicial
        return () => clearTimeout(timer);
    }, [checkUpdate]);

    return null; // Componente invisível
};
