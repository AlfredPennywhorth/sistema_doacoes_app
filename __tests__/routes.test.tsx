import React from 'react';
import { render } from '@testing-library/react-native';
import DeleteAccountWebScreen from '../src/app/delete-account';
import PublicPrivacyScreen from '../src/app/privacy';

describe('Public Routes', () => {
  it('renders DeleteAccountWebScreen without crashing', () => {
    const { getByText } = render(<DeleteAccountWebScreen />);
    expect(getByText('Exclusão de Conta')).toBeTruthy();
  });

  it('renders PublicPrivacyScreen without crashing', () => {
    const { getByText } = render(<PublicPrivacyScreen />);
    expect(getByText('Política de Privacidade')).toBeTruthy();
  });
});
