import { renderHook } from "@testing-library/react";
import { useRealtimeExams } from "./useRealtimeExams";
import { io } from "socket.io-client";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("socket.io-client", () => {
  const mSocket = {
    on: vi.fn(),
    disconnect: vi.fn(),
  };
  return { io: vi.fn(() => mSocket) };
});

describe("useRealtimeExams", () => {
  const mockCallback = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("socket bağlantısı kurmalı", () => {
    renderHook(() => useRealtimeExams(mockCallback));
    expect(io).toHaveBeenCalledWith("http://localhost:3001");
  });

  it("schedule_updated olayını dinlemeli ve gecikmeli olarak callback çağırmalı", async () => {
    const { unmount: _unmount } = renderHook(() => useRealtimeExams(mockCallback));
    
    // Get the socket instance and its 'on' method
    const mSocket = vi.mocked(io).mock.results[0].value;
    const onHandler = mSocket.on;

    // Find the 'schedule_updated' handler
    const [_eventName, handler] = onHandler.mock.calls.find(([name]: any) => name === "schedule_updated");
    
    // Trigger the handler
    const testPayload = { type: "UPDATE" };
    handler(testPayload);

    // Should not be called immediately (delay is 500ms)
    expect(mockCallback).not.toHaveBeenCalled();

    // Fast forward time
    vi.advanceTimersByTime(500);

    expect(mockCallback).toHaveBeenCalledWith(testPayload);
  });

  it("unmount edildiğinde disconnect yapmalı", () => {
    const { unmount } = renderHook(() => useRealtimeExams(mockCallback));
    const mSocket = vi.mocked(io).mock.results[0].value;
    
    unmount();
    expect(mSocket.disconnect).toHaveBeenCalled();
  });
});
