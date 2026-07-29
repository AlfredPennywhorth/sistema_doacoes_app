import { fireEvent, render, waitFor } from "@testing-library/react-native";
import React from "react";
import { Alert } from "react-native";
import SettingsScreen from "../src/app/settings";
import { AuthProvider } from "../src/hooks/useAuth";

// Mocks
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock("../src/hooks/useAuth", () => ({
  useAuth: () => ({
    user: { id: "test-user-123" },
    signOut: jest.fn().mockResolvedValue(undefined),
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

const mockInvoke = jest.fn();

jest.mock("../src/config/supabase", () => ({
  supabase: {
    functions: {
      invoke: (...args: any[]) => mockInvoke(...args),
    },
  },
}));

describe("SettingsScreen / Delete Account", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInvoke.mockResolvedValue({ data: {}, error: null });
    jest.spyOn(Alert, "alert").mockImplementation(jest.fn());
  });

  it("requires EXCLUIR text to enable delete flow", async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <AuthProvider>
        <SettingsScreen />
      </AuthProvider>,
    );

    // Initial state: not expanded
    expect(queryByText("Atenção!")).toBeNull();

    // Click to expand delete section
    fireEvent.press(getByText("Excluir Minha Conta"));

    // Check if expanded
    expect(getByText("Atenção!")).toBeTruthy();

    // The confirm button should be present.
    const confirmBtn = getByText("Confirmar Exclusão");

    // Typing the wrong string
    const input = getByPlaceholderText("EXCLUIR");
    fireEvent.changeText(input, "TESTE");

    // disabled=true impede onPress.
    fireEvent.press(confirmBtn);

    expect(mockInvoke).not.toHaveBeenCalled();

    // Typing the correct string
    fireEvent.changeText(input, "EXCLUIR");
    fireEvent.press(confirmBtn);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith("delete-user", {});
    });
  });

  it("shows success alert when edge function succeeds", async () => {
    const { getByText, getByPlaceholderText } = render(
      <AuthProvider>
        <SettingsScreen />
      </AuthProvider>,
    );

    fireEvent.press(getByText("Excluir Minha Conta"));
    fireEvent.changeText(getByPlaceholderText("EXCLUIR"), "EXCLUIR");
    fireEvent.press(getByText("Confirmar Exclusão"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Conta excluída",
        "Sua conta e dados pessoais foram apagados com sucesso.",
        expect.any(Array),
      );
    });
  });

  it("shows generic error when edge function fails", async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: { message: "falha" },
    });

    const { getByText, getByPlaceholderText } = render(
      <AuthProvider>
        <SettingsScreen />
      </AuthProvider>,
    );

    fireEvent.press(getByText("Excluir Minha Conta"));
    fireEvent.changeText(getByPlaceholderText("EXCLUIR"), "EXCLUIR");

    // Click confirm
    fireEvent.press(getByText("Confirmar Exclusão"));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        "Erro",
        "Não foi possível excluir a conta. Tente novamente mais tarde.",
      );
    });
  });
});
