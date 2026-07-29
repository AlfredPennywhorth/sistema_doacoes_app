import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SettingsScreen from '../src/app/settings';
import { AuthProvider } from '../src/hooks/useAuth';

// Mocks
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  })
}));

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123' },
    signOut: jest.fn(),
  }),
  AuthProvider: ({ children }: any) => <>{children}</>
}));

jest.mock('../src/config/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: {}, error: null })
    }
  }
}));

describe('SettingsScreen / Delete Account', () => {
  it('shows delete account section and requires EXCLUIR text to confirm', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <AuthProvider>
        <SettingsScreen />
      </AuthProvider>
    );

    // Initial state: not expanded
    expect(queryByText('Atenção!')).toBeNull();

    // Click to expand delete section
    fireEvent.press(getByText('Excluir Minha Conta'));
    
    // Check if expanded
    expect(getByText('Atenção!')).toBeTruthy();
    
    // The confirm button should be disabled (or opacity 0.5) initially
    const confirmBtn = getByText('Confirmar Exclusão');
    
    // Typing the wrong string
    const input = getByPlaceholderText('EXCLUIR');
    fireEvent.changeText(input, 'TESTE');
    
    // Typing the correct string
    fireEvent.changeText(input, 'EXCLUIR');

    // Click confirm
    fireEvent.press(confirmBtn);

    // Wait for supabase function to be called
    const { supabase } = require('../src/config/supabase');
    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith('delete-user', {});
    });
  });
});
