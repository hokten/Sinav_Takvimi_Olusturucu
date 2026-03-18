"use client";

import { useState, useEffect } from "react";
import { createExam, updateExam } from "@/app/actions/exams";
import { X } from "lucide-react";

interface ScheduleDay { id: string; date: string; sessions: string[] }
interface Instructor { id: string; name: string; mainDeptId: string }
interface Course { id: string; code: string; name: string; section: number; instructorId: string; departmentId: string; adminOnly: boolean; instructor: Instructor }
interface Room { id: string; name: string }
interface RoomAssignment { roomId: string; departmentId: string }
interface Exam {
  id: string;
  courseId: string;
  date: string;
  time: string;
  roomIds: string[];
  supervisorIds: string[];
  instructorId: string;
  departmentId: string;
}

interface Props {
  exam: Exam | null;
  departmentId: string;
  scheduleDays: ScheduleDay[];
  courses: Course[];
  rooms: Room[];
  instructors: Instructor[];
  roomAssignments: RoomAssignment[];
  existingExams: Exam[];
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function ExamModal({
  exam,
  departmentId,
  scheduleDays,
  courses,
  rooms,
  instructors,
  roomAssignments,
  existingExams,
  onClose,
  onSuccess,
  onError,
}: Props) {
  const [courseId, setCourseId] = useState(exam?.courseId ?? "");
  const [date, setDate] = useState(exam?.date ?? scheduleDays[0]?.date ?? "");
  const [time, setTime] = useState(exam?.time ?? "");
  const [roomIds, setRoomIds] = useState<string[]>(exam?.roomIds ?? []);
  const [supervisorIds, setSupervisorIds] = useState<string[]>(exam?.supervisorIds ?? []);
  const [supervisorInput, setSupervisorInput] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedDay = scheduleDays.find((d) => d.date === date);
  const sessions = selectedDay?.sessions ?? [];

  // Rooms assigned to this department
  const assignedRoomIds = new Set(
    roomAssignments
      .filter((ra) => ra.departmentId === departmentId)
      .map((ra) => ra.roomId)
  );

  // Rooms occupied at selected date+time (excluding current exam)
  const occupiedRoomIds = new Set(
    existingExams
      .filter((e) => e.date === date && e.time === time && e.id !== exam?.id)
      .flatMap((e) => e.roomIds)
  );

  const selectedCourse = courses.find((c) => c.id === courseId);

  useEffect(() => {
    if (selectedCourse) {
      // auto-set instructor from course
    }
  }, [selectedCourse]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId || !date || !time || roomIds.length === 0) {
      onError("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    const instructorId = selectedCourse?.instructorId ?? "";
    if (!instructorId) {
      onError("Seçilen derse ait öğretim elemanı bulunamadı.");
      return;
    }

    setLoading(true);
    try {
      if (exam) {
        await updateExam(exam.id, { courseId, date, time, roomIds, supervisorIds, instructorId, departmentId });
        onSuccess("Sınav güncellendi.");
      } else {
        await createExam({ courseId, date, time, roomIds, supervisorIds, instructorId, departmentId });
        onSuccess("Sınav eklendi.");
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  function toggleRoom(roomId: string) {
    if (occupiedRoomIds.has(roomId)) return;
    setRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((r) => r !== roomId) : [...prev, roomId]
    );
  }

  function addSupervisor() {
    const name = supervisorInput.trim();
    if (!name || supervisorIds.includes(name)) return;
    setSupervisorIds((prev) => [...prev, name]);
    setSupervisorInput("");
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold">{exam ? "Sınav Düzenle" : "Yeni Sınav Ekle"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Ders */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ders</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              required
            >
              <option value="">Ders seçiniz...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] {c.name} Şb.{c.section} — {c.instructor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tarih */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
            <select
              value={date}
              onChange={(e) => { setDate(e.target.value); setTime(""); }}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              required
            >
              <option value="">Tarih seçiniz...</option>
              {scheduleDays.map((d) => (
                <option key={d.id} value={d.date}>{d.date}</option>
              ))}
            </select>
          </div>

          {/* Saat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Oturum Saati</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              required
              disabled={!date}
            >
              <option value="">Saat seçiniz...</option>
              {sessions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Derslikler */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Derslik(ler)</label>
            <div className="flex flex-wrap gap-2">
              {rooms.map((room) => {
                const isAssigned = assignedRoomIds.has(room.id);
                const isOccupied = occupiedRoomIds.has(room.id);
                const isSelected = roomIds.includes(room.id);

                if (!isAssigned) return null;

                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => toggleRoom(room.id)}
                    disabled={isOccupied}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                      isOccupied
                        ? "bg-red-50 border-red-300 text-red-500 cursor-not-allowed"
                        : isSelected
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {room.name}
                    {isOccupied && " ✕"}
                  </button>
                );
              })}
            </div>
            {roomIds.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">En az bir derslik seçiniz.</p>
            )}
          </div>

          {/* Gözetmenler */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gözetmenler (opsiyonel)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={supervisorInput}
                onChange={(e) => setSupervisorInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSupervisor(); } }}
                placeholder="Gözetmen adı yazıp Enter..."
                className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={addSupervisor}
                className="px-3 py-1.5 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Ekle
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {supervisorIds.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded border border-yellow-300"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => setSupervisorIds((prev) => prev.filter((x) => x !== s))}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Kaydediliyor..." : exam ? "Güncelle" : "Ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
