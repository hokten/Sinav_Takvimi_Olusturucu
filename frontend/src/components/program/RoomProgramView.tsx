"use client";

import { useState, useTransition } from "react";
import { RoomScheduleModal } from "./RoomScheduleModal";
import { createSlotRequest, withdrawSlotRequest } from "../../app/actions/requests";
import { useRealtimeExams } from "../../hooks/useRealtimeExams";

interface Program { id: string; name: string; color: string }
interface ScheduleDay { id: string; date: string; sessions: string[] }
interface Instructor { id: string; name: string }
interface Course { id: string; code: string; name: string; section: number }
interface Room { id: string; name: string }
interface Exam {
  id: string;
  date: string;
  time: string;
  roomIds: string[];
  supervisorIds: string[];
  instructorId: string;
  programId: string;
  course: Course;
  instructor: Instructor;
  program: Program;
}
interface MySlotRequest {
  id: string;
  roomId: string;
  date: string;
  time: string;
  status: string;
}
interface ApprovalItem {
  approved: boolean;
  program: { id: string; name: string };
}
interface ActiveSlotRequest {
  id: string;
  roomId: string;
  date: string;
  time: string;
  status: string;
  fromProgramId: string;
  fromProgram: { name: string; color: string };
  approvals: ApprovalItem[];
  ownerPrograms: { id: string; name: string }[];
}
interface RoomAssignment {
  id: string;
  roomId: string;
  programId: string;
}

interface Props {
  scheduleDays: ScheduleDay[];
  rooms: Room[];
  programs: Program[];
  exams: Exam[];
  userRole: string;
  userProgramId: string | null;
  userProgramIds: string[];
  mySlotRequests: MySlotRequest[];
  activeSlotRequests: ActiveSlotRequest[];
  roomAssignments: RoomAssignment[];
  allPrograms?: Program[];
}

const DAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split(".").map(Number);
  return new Date(year, month - 1, day);
}

function getDayName(dateStr: string): string {
  return DAYS_TR[parseDate(dateStr).getDay()];
}

function buildPendingTooltip(req: ActiveSlotRequest): string {
  const lines = [`Talep Eden: ${req.fromProgram.name}`, "", "Onay Durumu:"];
  for (const owner of req.ownerPrograms) {
    const approval = req.approvals.find((a) => a.program.id === owner.id);
    const status =
      approval === undefined
        ? "⏳ Bekleniyor"
        : approval.approved
        ? "✓ Onaylandı"
        : "✗ Reddedildi";
    lines.push(`  ${status} — ${owner.name}`);
  }
  return lines.join("\n");
}

function buildApprovedTooltip(req: ActiveSlotRequest): string {
  const lines = [`Rezerve Eden: ${req.fromProgram.name}`, "", "Onaylayan Programlar:"];
  for (const approval of req.approvals.filter((a) => a.approved)) {
    lines.push(`  ✓ ${approval.program.name}`);
  }
  return lines.join("\n");
}

export function RoomProgramView({
  scheduleDays,
  rooms,
  programs,
  exams,
  userRole,
  userProgramId,
  userProgramIds,
  mySlotRequests,
  activeSlotRequests,
  roomAssignments,
  allPrograms,
}: Props) {
  const router = { refresh: () => window.location.reload() };
  useRealtimeExams(() => router.refresh());

  const [roomFilter, setRoomFilter] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [requestingSlot, setRequestingSlot] = useState<string | null>(null);
  const [withdrawingSlot, setWithdrawingSlot] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(roomFilter.toLowerCase())
  );

  const programMap = Object.fromEntries((allPrograms || programs).map((p) => [p.id, p]));

  const myRoomIds = new Set(
    roomAssignments
      .filter((ra) => userProgramIds.includes(ra.programId))
      .map((ra) => ra.roomId)
  );

  const isDeptHead = userRole === "DEPT_HEAD";

  function handleKeyDown(e: React.KeyboardEvent<HTMLTableCellElement>, x: number, y: number) {
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
      const totalY = scheduleDays.reduce((acc, day) => acc + day.sessions.length, 0);
      const totalX = filteredRooms.length;
      let nextX = x;
      let nextY = y;
      if (e.key === "ArrowUp") nextY = Math.max(0, y - 1);
      if (e.key === "ArrowDown") nextY = Math.min(totalY - 1, y + 1);
      if (e.key === "ArrowLeft") nextX = Math.max(0, x - 1);
      if (e.key === "ArrowRight") nextX = Math.min(totalX - 1, x + 1);

      const nextEl = document.querySelector(`[data-cell="${nextX}-${nextY}"]`) as HTMLElement | null;
      if (nextEl) {
        nextEl.focus({ preventScroll: true });
        nextEl.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
      }
    }
  }

  function getExamsInRoom(roomId: string, date: string, time: string) {
    return exams.filter((e) => e.date === date && e.time === time && e.roomIds.includes(roomId));
  }

  function getActiveRequest(roomId: string, date: string, time: string): ActiveSlotRequest | null {
    return activeSlotRequests.find(
      (r) => r.roomId === roomId && r.date === date && r.time === time
    ) ?? null;
  }

  function getMyRequest(roomId: string, date: string, time: string): MySlotRequest | null {
    return mySlotRequests.find(
      (r) => r.roomId === roomId && r.date === date && r.time === time
    ) ?? null;
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleRequest(roomId: string, date: string, time: string) {
    if (!userProgramId) return;
    const slotKey = `${roomId}-${date}-${time}`;
    setRequestingSlot(slotKey);
    startTransition(async () => {
      try {
        await createSlotRequest({ programId: userProgramId, roomId, date, time });
        showToast("Talep gönderildi.", "success");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Talep gönderilemedi.", "error");
      } finally {
        setRequestingSlot(null);
      }
    });
  }

  function handleWithdraw(requestId: string, roomId: string, date: string, time: string) {
    const slotKey = `${roomId}-${date}-${time}`;
    setWithdrawingSlot(slotKey);
    startTransition(async () => {
      try {
        await withdrawSlotRequest(requestId);
        showToast("Talep geri çekildi.", "success");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Talep geri çekilemedi.", "error");
      } finally {
        setWithdrawingSlot(null);
      }
    });
  }

  if (scheduleDays.length === 0) {
    return <p className="text-gray-400 text-sm">Henüz sınav günü tanımlanmamış.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md text-sm text-white shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Legend for dept head */}
      {isDeptHead && (
        <div className="flex items-center gap-4 text-xs text-gray-600 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-green-100 border border-green-400 inline-block" />
            Bölümünüze ait salon
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-300 inline-block" />
            Diğer salonlar (boş slotta talep edebilirsiniz)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-purple-50 border border-purple-300 inline-block" />
            Rezerve edilmiş slot
          </span>
        </div>
      )}

      {/* Room filter */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          placeholder="Salon filtrele..."
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-48"
        />
        <span className="text-xs text-gray-400">Salon adına tıklayarak bireysel programı görüntüleyin</span>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr>
              <th className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium text-gray-700 sticky left-0 z-20 w-[150px] min-w-[150px]">
                Tarih
              </th>
              <th className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium text-gray-700 sticky left-[150px] z-20 w-[70px] min-w-[70px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                Saat
              </th>
              {filteredRooms.map((room) => {
                const isMine = isDeptHead && myRoomIds.has(room.id);
                return (
                  <th
                    key={room.id}
                    className={`border border-gray-200 px-3 py-2 font-medium min-w-[130px] cursor-pointer transition-colors ${
                      isMine
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : isDeptHead
                        ? "bg-amber-50 text-amber-800 hover:bg-amber-100"
                        : "bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                    onClick={() => setSelectedRoom(room)}
                    title="Salon programını görüntüle"
                  >
                    <div className="flex flex-col items-center">
                      <span>{room.name}</span>
                      {isMine && <span className="inline-block px-1.5 py-0.5 mt-1 bg-green-200 text-green-800 text-[10px] rounded font-semibold">Bölüm Salonu</span>}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {(() => {
              let globalY = 0;
              const rows: any[] = [];
              for (const day of scheduleDays) {
                const sortedSessions = [...day.sessions].sort();
                if (sortedSessions.length === 0) {
                  rows.push(
                    <tr key={day.date}>
                      <td
                        className="border border-gray-200 px-3 py-2 bg-blue-50 font-semibold text-blue-800 sticky left-0 z-10"
                        colSpan={filteredRooms.length + 2}
                      >
                        {day.date} {getDayName(day.date)} — Oturum tanımlanmamış
                      </td>
                    </tr>
                  );
                  continue;
                }

                for (let idx = 0; idx < sortedSessions.length; idx++) {
                  const session = sortedSessions[idx];
                  const currentY = globalY++;
                  rows.push(
                    <tr key={`${day.date}-${session}`}>
                      {idx === 0 ? (
                        <td
                          rowSpan={sortedSessions.length}
                          className="border border-gray-200 px-3 py-2 bg-blue-50 font-semibold text-blue-800 sticky left-0 z-10 align-middle text-center w-[150px] min-w-[150px]"
                        >
                          <p>{day.date}</p>
                          <p className="text-xs font-normal text-blue-600">{getDayName(day.date)}</p>
                        </td>
                      ) : null}
                      <td className="border border-gray-200 px-3 py-2 font-medium text-gray-600 bg-gray-50 whitespace-nowrap text-center align-middle sticky left-[150px] z-10 w-[70px] min-w-[70px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
                        {session}
                      </td>
                      {filteredRooms.map((room, roomIndex) => {
                        const cellExams = getExamsInRoom(room.id, day.date, session);
                        const hasConflict = cellExams.length > 1;
                        const isMine = isDeptHead && myRoomIds.has(room.id);
                    const isEmpty = cellExams.length === 0;
                    const slotKey = `${room.id}-${day.date}-${session}`;
                    const activeReq = getActiveRequest(room.id, day.date, session);
                    const isPendingSlot = activeReq?.status === "PENDING";
                    const isApprovedSlot = activeReq?.status === "APPROVED";
                    const isMyPending = isPendingSlot && userProgramIds.includes(activeReq!.fromProgramId);
                    // Rejected requests: user's own rejected request (no active request in the other list)
                    const myReq = isDeptHead && !isMine && !activeReq
                      ? getMyRequest(room.id, day.date, session)
                      : null;
                    const isRequesting = requestingSlot === slotKey && isPending;
                    const isWithdrawing = withdrawingSlot === slotKey && isPending;

                    let cellBg = isMine ? "bg-green-50" : "";
                    if (hasConflict) {
                      cellBg = "bg-red-50";
                    } else if (isEmpty && isApprovedSlot) {
                      cellBg = "bg-purple-50";
                    } else if (isEmpty && isPendingSlot) {
                      cellBg = "bg-amber-100/60";
                    } else if (isMine) {
                      cellBg = isEmpty ? "bg-green-50" : "bg-green-100/30";
                    } else if (isDeptHead) {
                      cellBg = isEmpty ? "bg-amber-50" : "";
                    }

                    return (
                      <td
                        key={room.id}
                        data-cell={`${roomIndex}-${currentY}`}
                        tabIndex={0}
                        onKeyDown={(e) => handleKeyDown(e, roomIndex, currentY)}
                        className={`border border-gray-200 px-2 py-1.5 align-middle text-center outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 focus:bg-blue-50 transition-colors scroll-ml-[220px] ${cellBg}`}
                      >
                        {hasConflict && (
                          <p className="text-red-600 text-xs font-medium mb-1">⚠ ÇAKIŞMA</p>
                        )}

                        {/* PENDING slot */}
                        {isPendingSlot && isEmpty && (
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <span
                              title={buildPendingTooltip(activeReq!)}
                              className="text-amber-700 font-semibold text-[11px] cursor-help underline decoration-dotted decoration-amber-500"
                            >
                              ⏳ BEKLİYOR
                            </span>
                            {isMyPending && (
                              <button
                                onClick={() => handleWithdraw(activeReq!.id, room.id, day.date, session)}
                                disabled={isWithdrawing}
                                className="text-[10px] text-gray-400 hover:text-red-500 font-medium disabled:opacity-50"
                              >
                                {isWithdrawing ? "..." : "Geri Çek"}
                              </button>
                            )}
                          </div>
                        )}

                        {/* APPROVED reservation slot — no exam */}
                        {isApprovedSlot && isEmpty && (
                          <span
                            title={buildApprovedTooltip(activeReq!)}
                            className="text-purple-700 font-semibold text-[11px] cursor-help underline decoration-dotted decoration-purple-500"
                          >
                            🔒 REZERVE
                          </span>
                        )}

                        {cellExams.map((exam) => {
                          const prog = programMap[exam.programId];
                          return (
                            <div
                              key={exam.id}
                              className="rounded px-1.5 py-1 mb-1 text-xs mx-auto text-center"
                              style={{
                                backgroundColor: (prog?.color ?? "#6B7280") + "20",
                                borderLeft: `3px solid ${prog?.color ?? "#6B7280"}`,
                              }}
                            >
                              <p className="font-mono font-semibold">{exam.course.code}</p>
                              <p className="text-gray-600 truncate">{exam.course.name}</p>
                              <p className="text-gray-500">{exam.instructor.name}</p>
                              <p className="text-xs font-medium mt-0.5" style={{ color: prog?.color }}>
                                {prog?.name}
                              </p>
                            </div>
                          );
                        })}

                        {/* Talep Et / Tekrar Talep Et — sadece bölüm başkanı, kendi salonu değil, boş slot, aktif talep yok */}
                        {isDeptHead && !isMine && isEmpty && !activeReq && (
                          <div className="mt-0.5">
                            {myReq?.status === "REJECTED" && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-red-500 font-medium">✕ Reddedildi</span>
                                <button
                                  onClick={() => handleRequest(room.id, day.date, session)}
                                  disabled={isRequesting}
                                  className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-medium disabled:opacity-50"
                                >
                                  {isRequesting ? "..." : "Tekrar Talep Et"}
                                </button>
                              </div>
                            )}
                            {!myReq && (
                              <button
                                onClick={() => handleRequest(room.id, day.date, session)}
                                disabled={isRequesting}
                                className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isRequesting ? "..." : "Talep Et"}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Kendi salonuna rezerve edilmiş slot uyarısı */}
                        {isMine && isEmpty && isApprovedSlot && (
                          <p className="text-[10px] text-purple-600 font-medium mt-0.5">
                            Bu slota sınav ekleyemezsiniz
                          </p>
                        )}
                        {isMine && isEmpty && !isApprovedSlot && !isPendingSlot && (
                          <span className="text-green-600/50 text-[10px] italic flex justify-center mt-1">Size ait</span>
                        )}
                      </td>
                    );
                  })}
                    </tr>
                  );
                }
              }
              return rows;
            })()}
          </tbody>
        </table>
      </div>

      {selectedRoom && (
        <RoomScheduleModal
          room={selectedRoom}
          exams={exams}
          programs={programMap}
          scheduleDays={scheduleDays}
          userRole={userRole}
          userProgramId={userProgramId}
          isMyRoom={isDeptHead && myRoomIds.has(selectedRoom.id)}
          activeSlotRequests={activeSlotRequests}
          onClose={() => setSelectedRoom(null)}
        />
      )}
    </div>
  );
}
