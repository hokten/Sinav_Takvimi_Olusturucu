"use client";

import { useState } from "react";
import type { Session } from "next-auth";
import { createSlotRequest, approveSlotRequest, rejectSlotRequest } from "@/app/actions/requests";
import { Toast } from "@/components/shared/Toast";

interface Department { id: string; name: string; color: string }
interface Room { id: string; name: string }
interface ScheduleDay { id: string; date: string; sessions: string[] }
interface Request {
  id: string;
  fromDepartmentId: string;
  roomId: string;
  date: string;
  time: string;
  status: string;
  fromDepartment: Department;
  room: Room;
}

interface Props {
  requests: Request[];
  rooms: Room[];
  scheduleDays: ScheduleDay[];
  session: Session;
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Bekliyor", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  APPROVED: { label: "Onaylandı", className: "bg-green-100 text-green-800 border-green-200" },
  REJECTED: { label: "Reddedildi", className: "bg-red-100 text-red-800 border-red-200" },
};

export function RequestsManager({ requests: initialRequests, rooms, scheduleDays, session }: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // New request form
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const isAdmin = session.user.role === "ADMIN";
  const selectedDay = scheduleDays.find((d) => d.date === date);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createSlotRequest({ roomId, date, time });
      setToast({ message: "Talep oluşturuldu.", type: "success" });
      setRoomId(""); setDate(""); setTime("");
      // Reload to refresh
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Hata oluştu.", type: "error" });
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveSlotRequest(id);
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "APPROVED" } : r));
      setToast({ message: "Talep onaylandı.", type: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Hata oluştu.", type: "error" });
    }
  }

  async function handleReject(id: string) {
    try {
      await rejectSlotRequest(id);
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "REJECTED" } : r));
      setToast({ message: "Talep reddedildi.", type: "success" });
    } catch (err) {
      setToast({ message: err instanceof Error ? err.message : "Hata oluştu.", type: "error" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Create request (dept head only) */}
      {!isAdmin && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Yeni Slot Talebi</h2>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Salon</label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                required
              >
                <option value="">Seçiniz...</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tarih</label>
              <select
                value={date}
                onChange={(e) => { setDate(e.target.value); setTime(""); }}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                required
              >
                <option value="">Seçiniz...</option>
                {scheduleDays.map((d) => (
                  <option key={d.id} value={d.date}>{d.date}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Saat</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                required
                disabled={!date}
              >
                <option value="">Seçiniz...</option>
                {selectedDay?.sessions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Talep Gönder
            </button>
          </form>
        </div>
      )}

      {/* Requests list */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-700">Bölüm</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Salon</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Tarih</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Saat</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Durum</th>
              {isAdmin && <th className="px-4 py-3 font-medium text-gray-700">İşlem</th>}
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="text-center py-8 text-gray-400">
                  Henüz talep bulunmuyor.
                </td>
              </tr>
            ) : (
              requests.map((req) => {
                const statusInfo = STATUS_LABELS[req.status] ?? STATUS_LABELS.PENDING;
                return (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: req.fromDepartment.color + "20",
                          color: req.fromDepartment.color,
                        }}
                      >
                        {req.fromDepartment.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{req.room.name}</td>
                    <td className="px-4 py-3">{req.date}</td>
                    <td className="px-4 py-3">{req.time}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        {req.status === "PENDING" && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="text-xs text-green-700 hover:text-green-900 font-medium"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="text-xs text-red-600 hover:text-red-800 font-medium"
                            >
                              Reddet
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
