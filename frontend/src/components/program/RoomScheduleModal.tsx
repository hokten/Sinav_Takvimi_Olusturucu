"use client";

import { useState, useTransition } from "react";
import { X, SendHorizonal, Clock, CheckCircle, XCircle } from "lucide-react";
import { createSlotRequest } from "../../app/actions/requests";

interface Program { id: string; name: string; color: string }
interface Course { id: string; code: string; name: string; section: number }
interface Instructor { id: string; name: string }
interface Room { id: string; name: string }
interface ScheduleDay { id: string; date: string; sessions: string[] }
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
interface SlotRequest {
  id: string;
  roomId: string;
  date: string;
  time: string;
  status: string;
}

interface Props {
  room: Room;
  exams: Exam[];
  programs: Record<string, Program>;
  scheduleDays: ScheduleDay[];
  userRole: string;
  userProgramId: string | null;
  isMyRoom: boolean;
  slotRequests: SlotRequest[];
  onClose: () => void;
}

const DAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split(".").map(Number);
  return new Date(year, month - 1, day);
}

function getDayName(dateStr: string): string {
  return DAYS_TR[parseDate(dateStr).getDay()];
}

export function RoomScheduleModal({
  room,
  exams,
  programs,
  scheduleDays,
  userRole,
  userProgramId,
  isMyRoom,
  slotRequests,
  onClose,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [pendingSlot, setPendingSlot] = useState<{ date: string; time: string } | null>(null);
  const [localRequests, setLocalRequests] = useState<SlotRequest[]>(slotRequests);
  const [error, setError] = useState<string | null>(null);

  const isDeptHead = userRole === "DEPT_HEAD";
  const canRequest = isDeptHead && !isMyRoom;

  function getExamsInSlot(date: string, time: string) {
    return exams.filter((e) => e.date === date && e.time === time && e.roomIds.includes(room.id));
  }

  function getRequestForSlot(date: string, time: string): SlotRequest | undefined {
    return localRequests.find(
      (r) => r.roomId === room.id && r.date === date && r.time === time
    );
  }

  function handleRequest(date: string, time: string) {
    setError(null);
    setPendingSlot({ date, time });
    startTransition(async () => {
      try {
        await createSlotRequest({ programId: userProgramId ?? "", roomId: room.id, date, time });
        setLocalRequests((prev) => [
          ...prev,
          { id: crypto.randomUUID(), roomId: room.id, date, time, status: "PENDING" },
        ]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Talep gönderilemedi.");
      } finally {
        setPendingSlot(null);
      }
    });
  }

  const allSlots: { date: string; dayName: string; sessions: string[] }[] = scheduleDays.map(
    (day) => ({
      date: day.date,
      dayName: getDayName(day.date),
      sessions: [...day.sessions].sort(),
    })
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-base font-semibold">{room.name} — Sınav Programı</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {exams.filter((e) => e.roomIds.includes(room.id)).length} sınav
              {canRequest && " · Boş slotlar için talep gönderebilirsiniz"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mx-5 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {allSlots.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Henüz sınav günü tanımlanmamış.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border border-gray-200 px-3 py-2 bg-gray-50 text-left font-medium text-gray-700 w-28">
                    Tarih
                  </th>
                  <th className="border border-gray-200 px-3 py-2 bg-gray-50 text-left font-medium text-gray-700 w-20">
                    Saat
                  </th>
                  <th className="border border-gray-200 px-3 py-2 bg-gray-50 text-left font-medium text-gray-700">
                    Durum
                  </th>
                  {canRequest && (
                    <th className="border border-gray-200 px-3 py-2 bg-gray-50 text-center font-medium text-gray-700 w-28">
                      Talep
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {allSlots.map(({ date, dayName, sessions }) =>
                  sessions.length === 0 ? (
                    <tr key={date}>
                      <td
                        colSpan={canRequest ? 4 : 3}
                        className="border border-gray-200 px-3 py-2 text-gray-400 text-xs italic"
                      >
                        {date} {dayName} — Oturum tanımlanmamış
                      </td>
                    </tr>
                  ) : (
                    sessions.map((session, idx) => {
                      const slotExams = getExamsInSlot(date, session);
                      const request = getRequestForSlot(date, session);
                      const isOccupied = slotExams.length > 0;
                      const isLoading =
                        isPending &&
                        pendingSlot?.date === date &&
                        pendingSlot?.time === session;

                      return (
                        <tr key={`${date}-${session}`} className="hover:bg-gray-50">
                          {idx === 0 ? (
                            <td
                              rowSpan={sessions.length}
                              className="border border-gray-200 px-3 py-2 align-top"
                            >
                              <p className="font-medium whitespace-nowrap">{date}</p>
                              <p className="text-xs text-gray-500">{dayName}</p>
                            </td>
                          ) : null}
                          <td className="border border-gray-200 px-3 py-2 font-mono text-xs font-medium text-gray-700 whitespace-nowrap">
                            {session}
                          </td>
                          <td className="border border-gray-200 px-3 py-2">
                            {isOccupied ? (
                              slotExams.map((exam) => {
                                const prog = programs[exam.programId];
                                return (
                                  <div
                                    key={exam.id}
                                    className="rounded px-1.5 py-1 mb-1 text-xs"
                                    style={{
                                      backgroundColor: (prog?.color ?? "#6B7280") + "20",
                                      borderLeft: `3px solid ${prog?.color ?? "#6B7280"}`,
                                    }}
                                  >
                                    <p className="font-mono font-semibold">{exam.course.code}</p>
                                    <p className="text-gray-600">{exam.course.name} Şb.{exam.course.section}</p>
                                    <p className="text-gray-500">{exam.instructor.name}</p>
                                    <p className="text-xs font-medium mt-0.5" style={{ color: prog?.color }}>
                                      {prog?.name}
                                    </p>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-gray-400 text-xs italic">Boş</span>
                            )}
                          </td>
                          {canRequest && (
                            <td className="border border-gray-200 px-3 py-2 text-center">
                              {isOccupied ? (
                                <span className="text-gray-300 text-xs">—</span>
                              ) : request ? (
                                <RequestStatusBadge status={request.status} />
                              ) : (
                                <button
                                  onClick={() => handleRequest(date, session)}
                                  disabled={isLoading || isPending}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                  {isLoading ? (
                                    <span className="animate-spin">⟳</span>
                                  ) : (
                                    <SendHorizonal size={12} />
                                  )}
                                  Talep Et
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function RequestStatusBadge({ status }: { status: string }) {
  if (status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-yellow-50 text-yellow-700">
        <Clock size={11} />
        Bekliyor
      </span>
    );
  }
  if (status === "APPROVED") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-green-50 text-green-700">
        <CheckCircle size={11} />
        Onaylandı
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-red-50 text-red-700">
      <XCircle size={11} />
      Reddedildi
    </span>
  );
}
