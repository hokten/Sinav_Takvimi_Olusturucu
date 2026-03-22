import axios from "./axios";
import { vi, describe, it, expect, beforeEach } from "vitest";

// We don't want to mock the WHOLE axios, just the parts we need to test the interceptor logic
// But since lib/axios.ts side-effects the global axios, this is tricky in unit tests.
// A better way is to test how it modifies config.

describe("Axios Interceptor", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("Authorization başlığını localStorage'daki tokene göre eklemeli", async () => {
    localStorage.setItem("token", "my-secret-token");
    
    // Create a mock config
    const config = { headers: {} as any, url: "/test" };
    
    // Get the request interceptor handler
    const requestHandler = (axios.interceptors.request as any).handlers[0].fulfilled;
    const updatedConfig = await requestHandler(config);

    expect(updatedConfig.headers.Authorization).toBe("Bearer my-secret-token");
  });

  it("/auth/login için 401 durumunda redirect yapmamalı", async () => {
    const error = {
      response: { status: 401 },
      config: { url: "/auth/login" }
    };
    
    const responseHandler = (axios.interceptors.response as any).handlers[0].rejected;
    
    // We mock window.location to check if it was NOT changed
    const originalLocation = window.location.href;
    
    try {
      await responseHandler(error);
    } catch (e) {
      // Expected to reject
    }

    expect(window.location.href).toBe(originalLocation);
  });
});
