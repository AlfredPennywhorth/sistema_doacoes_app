import { render } from "@testing-library/react-native";
import React from "react";
import { getAuthRedirect } from "../src/app/_layout";
import DeleteAccountWebScreen from "../src/app/delete-account";
import PublicPrivacyScreen from "../src/app/privacy";

describe("Public Routes", () => {
  it("renders DeleteAccountWebScreen without crashing", () => {
    const { getByText } = render(<DeleteAccountWebScreen />);
    expect(getByText("Exclusão de Conta")).toBeTruthy();
  });

  it("renders PublicPrivacyScreen without crashing", () => {
    const { getByText } = render(<PublicPrivacyScreen />);
    expect(getByText("Política de Privacidade")).toBeTruthy();
  });

  it("does not redirect unauthenticated users on public routes", () => {
    expect(getAuthRedirect(false, false, "privacy")).toBeNull();
    expect(getAuthRedirect(false, false, "delete-account")).toBeNull();
    expect(getAuthRedirect(false, false, "legal")).toBeNull();
  });

  it("redirects unauthenticated users from protected routes", () => {
    expect(getAuthRedirect(false, false, "(tabs)")).toBe("/auth/login");
    expect(getAuthRedirect(false, false, "settings")).toBe("/auth/login");
  });

  it("redirects authenticated users away from auth routes", () => {
    expect(getAuthRedirect(false, true, "auth")).toBe("/(tabs)");
  });
});
