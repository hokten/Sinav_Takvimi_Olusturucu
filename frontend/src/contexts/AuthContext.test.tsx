import { render, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import axios from "axios";
import { vi, describe, it, expect, beforeEach } from "vitest";
import type { Mocked } from "vitest";

vi.mock("axios");
const mockedAxios = axios as Mocked<typeof axios>;

// Test component to access useAuth hook
const TestComponent = () => {
  const { user, token, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="user">{user ? user.email : "guest"}</div>
      <div data-testid="token">{token || "no-token"}</div>
      <button onClick={() => login("test-token", { email: "test@example.com" })} data-testid="login-btn">Login</button>
      <button onClick={() => logout()} data-testid="logout-btn">Logout</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    delete mockedAxios.defaults.headers.common["Authorization"];
    // Default mock to prevent "then" of undefined
    mockedAxios.get.mockImplementation(() => new Promise(() => {})); 
  });

  it("başlangıçta misafir durumunda olmalı", async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByTestId("user").textContent).toBe("guest");
    expect(getByTestId("token").textContent).toBe("no-token");
  });

  it("localStorage'da token varsa kullanıcıyı yüklemeli", async () => {
    localStorage.setItem("token", "existing-token");
    mockedAxios.get.mockResolvedValueOnce({ data: { email: "loaded@example.com" } });

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("user").textContent).toBe("loaded@example.com");
    });
    expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining("/auth/me"));
  });

  it("login fonksiyonu state'i ve localStorage'ı güncellemeli", async () => {
    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginBtn = getByTestId("login-btn");
    await act(async () => {
      loginBtn.click();
    });

    expect(getByTestId("user").textContent).toBe("test@example.com");
    expect(getByTestId("token").textContent).toBe("test-token");
    expect(localStorage.getItem("token")).toBe("test-token");
  });

  it("logout fonksiyonu state'i temizlemeli", async () => {
    localStorage.setItem("token", "to-be-cleared");
    mockedAxios.get.mockResolvedValueOnce({ data: { email: "user@example.com" } });

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("user").textContent).toBe("user@example.com");
    });

    const logoutBtn = getByTestId("logout-btn");
    await act(async () => {
      logoutBtn.click();
    });

    expect(getByTestId("user").textContent).toBe("guest");
    expect(getByTestId("token").textContent).toBe("no-token");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("API hatası durumunda logout yapmalı", async () => {
    localStorage.setItem("token", "invalid-token");
    mockedAxios.get.mockRejectedValueOnce(new Error("Unauthorized"));

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByTestId("user").textContent).toBe("guest");
    });
    expect(localStorage.getItem("token")).toBeNull();
  });
});
