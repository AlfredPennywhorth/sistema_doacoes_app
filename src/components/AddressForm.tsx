import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { lookupAddressByCep, AddressByCep } from '../services/api/addressApi';
import { getBrazilianStates, getCitiesByState, BrazilianState, BrazilianCity } from '../services/api/ibgeApi';

export interface AddressFormProps {
  initialValues?: any;
  onChange: (address: any) => void;
  disabled?: boolean;
}

export const AddressForm: React.FC<AddressFormProps> = ({ initialValues, onChange, disabled }) => {
  const [cep, setCep] = useState(initialValues?.cep || '');
  const [street, setStreet] = useState(initialValues?.street || '');
  const [number, setNumber] = useState(initialValues?.number || '');
  const [complement, setComplement] = useState(initialValues?.complement || '');
  const [neighborhood, setNeighborhood] = useState(initialValues?.neighborhood || '');
  const [state, setState] = useState(initialValues?.state || '');
  const [city, setCity] = useState(initialValues?.city || '');
  const [reference, setReference] = useState(initialValues?.reference || '');

  const [loadingCep, setLoadingCep] = useState(false);
  const [cepError, setCepError] = useState('');

  // Not implementing full select dropdown for IBGE for brevity, just storing text
  // In a real app we would map states to Picker or BottomSheet.
  // We'll still fetch IBGE states to pre-warm cache or validate if needed.

  useEffect(() => {
    onChange({ cep, street, number, complement, neighborhood, state, city, reference });
  }, [cep, street, number, complement, neighborhood, state, city, reference]);

  const handleCepChange = (text: string) => {
    // simple mask
    let masked = text.replace(/\D/g, '');
    if (masked.length > 5) {
      masked = masked.replace(/^(\d{5})(\d)/, '$1-$2');
    }
    setCep(masked);
    
    if (masked.replace('-', '').length === 8) {
      fetchCep(masked);
    }
  };

  const fetchCep = async (cepToFetch: string) => {
    setLoadingCep(true);
    setCepError('');
    try {
      const data = await lookupAddressByCep(cepToFetch);
      if (data.street) setStreet(data.street);
      if (data.neighborhood) setNeighborhood(data.neighborhood);
      if (data.city) setCity(data.city);
      if (data.state) setState(data.state);
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') setCepError('CEP não encontrado.');
      else if (err.message === 'INVALID_INPUT') setCepError('CEP inválido.');
      else setCepError('Não foi possível consultar o endereço.');
    } finally {
      setLoadingCep(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>CEP</Text>
      <View style={styles.cepContainer}>
        <TextInput
          style={[styles.input, styles.flex1]}
          value={cep}
          onChangeText={handleCepChange}
          keyboardType="numeric"
          maxLength={9}
          placeholder="00000-000"
          editable={!disabled}
        />
        {loadingCep && <ActivityIndicator style={styles.loader} size="small" color="#0284c7" />}
      </View>
      {!!cepError && <Text style={styles.errorText}>{cepError}</Text>}

      <Text style={styles.label}>Rua / Logradouro</Text>
      <TextInput
        style={styles.input}
        value={street}
        onChangeText={setStreet}
        placeholder="Rua das Flores"
        editable={!disabled}
      />

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.label}>Número</Text>
          <TextInput
            style={styles.input}
            value={number}
            onChangeText={setNumber}
            placeholder="123"
            editable={!disabled}
          />
        </View>
        <View style={{ width: 10 }} />
        <View style={styles.flex1}>
          <Text style={styles.label}>Complemento</Text>
          <TextInput
            style={styles.input}
            value={complement}
            onChangeText={setComplement}
            placeholder="Apto 1"
            editable={!disabled}
          />
        </View>
      </View>

      <Text style={styles.label}>Bairro</Text>
      <TextInput
        style={styles.input}
        value={neighborhood}
        onChangeText={setNeighborhood}
        placeholder="Centro"
        editable={!disabled}
      />

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.label}>Cidade</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            editable={!disabled}
          />
        </View>
        <View style={{ width: 10 }} />
        <View style={{ flex: 0.5 }}>
          <Text style={styles.label}>UF</Text>
          <TextInput
            style={styles.input}
            value={state}
            onChangeText={setState}
            maxLength={2}
            autoCapitalize="characters"
            editable={!disabled}
          />
        </View>
      </View>

      <Text style={styles.label}>Ponto de Referência</Text>
      <TextInput
        style={styles.input}
        value={reference}
        onChangeText={setReference}
        placeholder="Próximo à padaria"
        editable={!disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%' },
  row: { flexDirection: 'row' },
  flex1: { flex: 1 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 4, marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  cepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loader: { marginLeft: 10 },
  errorText: { color: 'red', fontSize: 12, marginTop: 4 }
});
