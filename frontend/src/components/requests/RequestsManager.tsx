"use client";

import { useState } from "react";
import {
  createSlotRequest,
  approveSlotRequest,
  rejectSlotRequest,
  withdrawSlotRequest,
} from "@/app/actions/requests";

type Session = any;
import { Toast } from "@/components/shared/Toast";
import { slotRequestSchema } from "@/lib/validations";
import { useRealtimeExams } from "@/hooks/useRealtimeExams";

interface Program { id: string; name: string; color: string }
interface Room { id: string; name: string }
interface ScheduleDay { id: string; date: string; sessions: string[] }
interface Approval { programId: string; approved: boolean }
interface Request {
  id: string;
  fromProgramId: string;
  roomId: string;
  date: string;
  time: string;
  status: string;
  fromProgram: Program;
  room: Room;
  ownerProgramIds: string[];
  approvals: Approval[];
}

interface Props {
  requests: Request[];
  rooms: Room[];
  scheduleDays: ScheduleDay[];
  session: Session;
  userPrograms: Program[];
  userProgramIds: string[];
  userOwnedRoomIds: string[];
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Bekliyor", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  APPROVED: { label: "Onaylandı", className: "bg-green-100 text-green-800 border-green-200" },
  REJECTED: { label: "Reddedildi", className: "bg-red-100 text-red-800 border-red-200" },
};

export function RequestsManager({
  requests: initialRequests,
  rooms,
  scheduleDays,
  session,
  userPrograms,
  userProgramIds,
  userOwnedRoomIds,
}: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Real-time refresh
  useRealtimeExams(() => {
    window.location.reload();
  });

  const [programId, setProgramId] = useState(userPrograms[0]?.id ?? "");
  const [roomId, setRoomId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const isAdmin = session.user.role === "ADMIN";
  const selectedDay = scheduleDays.find((d) => d.date === date);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const validation = slotRequestSchema.safeParse({ programId, roomId, date, time });
    if (!validation.success) {
      showToast(validation.error.issues[0].message, "error");
      return;
    }
    try {
      await createSlotRequest(validation.data);
      showToast("Talep oluşturuldu.", "success");
      setRoomId(""); setDate(""); setTime("");
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Hata oluştu.", "error");
    }
  }

  async function handleApprove(id: string) {
    try {
      await approveSlotRequest(id);
      showToast("Onay verildi.", "success");
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Hata oluştu.", "error");
    }
  }

  async function handleReject(id: string) {
    try {
      await rejectSlotRequest(id);
      showToast("Talep reddedildi.", "success");
      setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: "REJECTED" } : r));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Hata oluştu.", "error");
    }
  }

  async function handleWithdraw(id: string) {
    try {
      await withdrawSlotRequest(id);
      showToast("Talep geri çekildi.", "success");
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Hata oluştu.", "error");
    }
  }

  function getApprovalProgress(req: Request) {
    const totalOwners = req.ownerProgramIds.length;
    if (totalOwners === 0) return null;
    const approvedCount = req.approvals.filter((a) => a.approved).length;
    return { approvedCount, totalOwners };
  }

  function canApproveOrReject(req: Request): boolean {
    if (isAdmin) return false;
    if (req.status !== "PENDING") return false;
    const myOwnerProgramIds = req.ownerProgramIds.filter((pid) => userProgramIds.includes(pid));
    if (myOwnerProgramIds.length === 0) return false;
    // Zaten oy verdiyse gösterme
    const alreadyVoted = req.approvals.some((a) => userProgramIds.includes(a.programId));
    return !alreadyVoted;
  }

  function canWithdraw(req: Request): boolean {
    return !isAdmin && req.status === "PENDING" && userProgramIds.includes(req.fromProgramId);
  }

  // Bölüm başkanı için "Talep Gönder" formunda: kendi salonlarına talep göndermemeli
  const requestableRooms = rooms.filter((r) => !userOwnedRoomIds.includes(r.id));

  return (
    <div className="space-y-6">
      {/* Create request (dept head only) */}
      {!isAdmin && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Yeni Slot Talebi</h2>
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
            {userPrograms.length > 1 && (
              <div>
                <label htmlFor="program-select" className="block text-xs text-gray-500 mb-1">Program</label>
                <select
                  id="program-select"
                  value={programId}
                  onChange={(e) => setProgramId(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                  required
                >
                  {userPrograms.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="room-select" className="block text-xs text-gray-500 mb-1">Salon</label>
              <select
                id="room-select"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
                required
              >
                <option value="">Seçiniz...</option>
                {requestableRooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="date-select" className="block text-xs text-gray-500 mb-1">Tarih</label>
              <select
                id="date-select"
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
              <label htmlFor="time-select" className="block text-xs text-gray-500 mb-1">Saat</label>
              <select
                id="time-select"
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
          {requestableRooms.length === 0 && (
            <p className="text-xs text-gray-400 mt-2">Talep gönderebileceğiniz başka salon bulunmuyor.</p>
          )}
        </div>
      )}

      {/* Requests list */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-700">Talep Eden</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Salon</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Tarih</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Saat</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Durum</th>
              <th className="px-4 py-3 font-medium text-gray-700">İşlem</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  Henüz talep bulunmuyor.
                </td>
              </tr>
            ) : (
              requests.map((req) => {
                const statusInfo = STATUS_LABELS[req.status] ?? STATUS_LABELS.PENDING;
                const progress = getApprovalProgress(req);
                const showApproveReject = canApproveOrReject(req);
                const showWithdraw = canWithdraw(req);

                return (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: req.fromProgram.color + "20",
                          color: req.fromProgram.color,
                        }}
                      >
                        {req.fromProgram.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{req.room.name}</td>
                    <td className="px-4 py-3">{req.date}</td>
                    <td className="px-4 py-3">{req.time}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs border ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                      {req.status === "PENDING" && progress && progress.totalOwners > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {progress.approvedCount}/{progress.totalOwners} onay
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        {showApproveReject && (
                          <>
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
                          </>
                        )}
                        {showWithdraw && (
                          <button
                            onClick={() => handleWithdraw(req.id)}
                            className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                          >
                            Geri Çek
                          </button>
                        )}
                      </div>
                    </td>
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
