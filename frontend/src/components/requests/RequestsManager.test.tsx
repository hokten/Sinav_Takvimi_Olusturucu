import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RequestsManager } from "./RequestsManager";
import * as actions from "@/app/actions/requests";

// Mock actions
vi.mock("@/app/actions/requests", () => ({
  createSlotRequest: vi.fn(),
  approveSlotRequest: vi.fn(),
  rejectSlotRequest: vi.fn(),
  withdrawSlotRequest: vi.fn(),
}));

// Mock Toast
vi.mock("@/components/shared/Toast", () => {
  return {
    Toast: ({ message }: { message: string }) => <div data-testid="toast-msg">{message}</div>,
  };
});

describe("RequestsManager", () => {
  const mockProps = {
    requests: [],
    rooms: [
      { id: "r1", name: "Room 1" },
      { id: "r2", name: "Room 2" },
      { id: "r3", name: "Room 3" },
    ],
    scheduleDays: [
      { id: "d1", date: "01.01.2024", sessions: ["10:00", "12:00"] },
    ],
    session: { user: { role: "DEPT_HEAD", id: "u1" } },
    userPrograms: [{ id: "p1", name: "Program 1", color: "#000" }],
    userProgramIds: ["p1"],
    userOwnedRoomIds: ["r1"], // User owns Room 1
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("kullanıcı kendi odalarını 'Salon' listesinde görmemeli", () => {
    render(<RequestsManager {...mockProps} />);
    
    const roomSelect = screen.getByLabelText("Salon");
    const options = Array.from(roomSelect.querySelectorAll("option")).map(opt => opt.textContent);
    
    expect(options).toContain("Room 2");
    expect(options).toContain("Room 3");
    expect(options).not.toContain("Room 1");
  });

  it("geçerli verilerle talep göndermeli", async () => {
    render(<RequestsManager {...mockProps} />);
    
    fireEvent.change(screen.getByLabelText("Salon"), { target: { value: "r2" } });
    fireEvent.change(screen.getByLabelText("Tarih"), { target: { value: "01.01.2024" } });
    fireEvent.change(screen.getByLabelText("Saat"), { target: { value: "10:00" } });
    
    const submitButton = screen.getByText("Talep Gönder");
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(actions.createSlotRequest).toHaveBeenCalledWith({
        programId: "p1",
        roomId: "r2",
        date: "01.01.2024",
        time: "10:00",
      });
    });
  });

  it("eksik veriyle gönderim yapılmaya çalışıldığında hata vermeli (Zod)", async () => {
    render(<RequestsManager {...mockProps} />);
    
    const submitButton = screen.getByText("Talep Gönder");
    const form = submitButton.closest("form");
    fireEvent.submit(form!);

    // findByText waits automatically
    const toast = await screen.findByTestId("toast-msg");
    expect(toast.textContent).toMatch(/Derslik seçiniz|Geçersiz tarih|Saat seçiniz/);
    expect(actions.createSlotRequest).not.toHaveBeenCalled();
  });
});
