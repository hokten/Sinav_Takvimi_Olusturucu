"use client";

import { useState, useEffect, useRef } from "react";
import { createExam, updateExam } from "@/app/actions/exams";
import { X } from "lucide-react";

interface ScheduleDay { id: string; date: string; sessions: string[] }
interface Instructor { id: string; name: string; mainProgramId: string }
interface Program { id: string; name: string; color: string; isSharedSource: boolean }
interface Course {
  id: string;
  code: string;
  name: string;
  section: number;
  quota: number;
  instructorId: string;
  programId: string;
  adminOnly: boolean;
  instructor: Instructor;
  program: Program;
}
interface Room { id: string; name: string; capacity: number }
interface RoomAssignment { roomId: string; programId: string }
interface ApprovedReservation {
  roomId: string;
  date: string;
  time: string;
  fromProgramId: string;
  fromProgram: { name: string; color: string };
}
interface Exam {
  id: string;
  courseId: string;
  date: string;
  time: string;
  roomIds: string[];
  supervisorIds: string[];
  instructorId: string;
  programId: string;
}

const CAPACITY_BUFFER = 5;

interface Props {
  exam: Exam | null;
  programId: string;
  isAdmin: boolean;
  scheduleDays: ScheduleDay[];
  courses: Course[];
  rooms: Room[];
  instructors: Instructor[];
  roomAssignments: RoomAssignment[];
  existingExams: Exam[];
  approvedReservations: ApprovedReservation[];
  sharedSourceProgramIds: string[];
  initialDate?: string;
  initialTime?: string;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function suggestRooms(
  quota: number,
  availableRooms: Room[]
): Array<{ ids: string[]; totalCapacity: number; names: string[] }> {
  const effectiveNeed = Math.max(0, quota - CAPACITY_BUFFER);
  const roomsWithCap = availableRooms.filter((r) => r.capacity > 0);
  const sorted = [...roomsWithCap].sort((a, b) => a.capacity - b.capacity);
  const suggestions: Array<{ ids: string[]; totalCapacity: number; names: string[] }> = [];

  // Single rooms that fit
  for (const room of sorted) {
    if (room.capacity >= effectiveNeed) {
      suggestions.push({ ids: [room.id], totalCapacity: room.capacity, names: [room.name] });
    }
  }

  // If no single room fits, try pairs
  if (suggestions.length === 0) {
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const total = sorted[i].capacity + sorted[j].capacity;
        if (total >= effectiveNeed) {
          suggestions.push({
            ids: [sorted[i].id, sorted[j].id],
            totalCapacity: total,
            names: [sorted[i].name, sorted[j].name],
          });
          if (suggestions.length >= 4) break;
        }
      }
      if (suggestions.length >= 4) break;
    }
  }

  return suggestions.slice(0, 5);
}

export function ExamModal({
  exam,
  programId,
  isAdmin,
  scheduleDays,
  courses,
  rooms,
  instructors,
  roomAssignments,
  existingExams,
  approvedReservations,
  sharedSourceProgramIds,
  initialDate,
  initialTime,
  onClose,
  onSuccess,
  onError,
}: Props) {
  const [courseId, setCourseId] = useState(exam?.courseId ?? "");
  const [courseSearch, setCourseSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [date, setDate] = useState(exam?.date ?? initialDate ?? scheduleDays[0]?.date ?? "");
  const [time, setTime] = useState(exam?.time ?? initialTime ?? "");
  const [roomIds, setRoomIds] = useState<string[]>(exam?.roomIds ?? []);
  const [supervisorIds, setSupervisorIds] = useState<string[]>(exam?.supervisorIds ?? []);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const selectedCourse = courses.find((c) => c.id === courseId);

  // Autocomplete: filter courses by search text
  const filteredCourses = courseSearch.length >= 1
    ? courses.filter((c) =>
        c.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
        c.name.toLowerCase().includes(courseSearch.toLowerCase())
      ).slice(0, 10)
    : [];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isSharedCourse = selectedCourse
    ? sharedSourceProgramIds.includes(selectedCourse.programId)
    : sharedSourceProgramIds.includes(programId);

  // Bölüm başkanının bu slot için onaylı talep sahibi olduğu salonlar
  const approvedRequestRoomIds = new Set(
    !isAdmin && date && time
      ? approvedReservations
          .filter((r) => r.date === date && r.time === time && r.fromProgramId === programId)
          .map((r) => r.roomId)
      : []
  );

  // Admin: tüm salonlar görünür; Dept head: atanmış salonlar + onaylı talep salonları
  const baseAssignedRoomIds = new Set(
    isAdmin || isSharedCourse
      ? rooms.map((r) => r.id)
      : roomAssignments
          .filter((ra) => ra.programId === (isSharedCourse && selectedCourse ? selectedCourse.programId : programId))
          .map((ra) => ra.roomId)
  );
  const assignedRoomIds = new Set([...baseAssignedRoomIds, ...approvedRequestRoomIds]);

  // Bölüm başkanının kendi salonlarında başka bölüme rezerve olan slotlar
  const reservedByOtherRoomIds = new Set(
    !isAdmin && date && time
      ? approvedReservations
          .filter(
            (r) =>
              r.date === date &&
              r.time === time &&
              r.fromProgramId !== programId &&
              baseAssignedRoomIds.has(r.roomId)
          )
          .map((r) => r.roomId)
      : []
  );

  // Hangi rezervasyon hangi salonu kaplıyor (UI için)
  const reservationByRoom = new Map(
    approvedReservations
      .filter((r) => date && time && r.date === date && r.time === time)
      .map((r) => [r.roomId, r])
  );

  const selectedDay = scheduleDays.find((d) => d.date === date);
  const sessions = selectedDay?.sessions ?? [];

  const examsAtSlot = date && time
    ? existingExams.filter((e) => e.date === date && e.time === time && e.id !== exam?.id)
    : [];
  const occupiedRoomIds = new Set(examsAtSlot.flatMap((e) => e.roomIds));
  const busyInstructorIds = new Set(examsAtSlot.map((e) => e.instructorId));

  const availableInstructors = instructors.filter((i) => !busyInstructorIds.has(i.id));
  const unavailableInstructors = instructors.filter((i) => busyInstructorIds.has(i.id));

  const assignedRooms = rooms.filter((r) => assignedRoomIds.has(r.id));
  const availableRooms = assignedRooms.filter((r) => !occupiedRoomIds.has(r.id));
  const hasSlotSelected = !!(date && time);

  // Capacity calculation
  const selectedRooms = rooms.filter((r) => roomIds.includes(r.id));
  const totalSelectedCapacity = selectedRooms.reduce((sum, r) => sum + r.capacity, 0);
  const quota = selectedCourse?.quota ?? 0;
  const roomsHaveCapacity = selectedRooms.length > 0 && selectedRooms.some((r) => r.capacity > 0);
  const isUnderCapacity = roomsHaveCapacity && totalSelectedCapacity < quota - CAPACITY_BUFFER;

  // Room suggestions (only when course selected and slot selected)
  const suggestions = quota > 0 && hasSlotSelected
    ? suggestRooms(quota, availableRooms)
    : [];

  function selectCourse(c: Course) {
    setCourseId(c.id);
    setCourseSearch("");
    setShowDropdown(false);
  }

  function clearCourse() {
    setCourseId("");
    setCourseSearch("");
    setRoomIds([]);
  }

  function toggleRoom(roomId: string) {
    if (occupiedRoomIds.has(roomId) || reservedByOtherRoomIds.has(roomId)) return;
    setRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((r) => r !== roomId) : [...prev, roomId]
    );
  }

  function applySuggestion(ids: string[]) {
    setRoomIds(ids.filter((id) => !occupiedRoomIds.has(id) && !reservedByOtherRoomIds.has(id)));
  }

  function toggleSupervisor(instructorName: string) {
    setSupervisorIds((prev) =>
      prev.includes(instructorName)
        ? prev.filter((s) => s !== instructorName)
        : [...prev, instructorName]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!courseId || !date || !time || roomIds.length === 0) {
      onError("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }
    if (!isSharedCourse && supervisorIds.length !== roomIds.length) {
      onError(`Seçilen derslik sayısı kadar gözetmen atanmalı. (${roomIds.length} derslik → ${roomIds.length} gözetmen gerekli)`);
      return;
    }
    if (isUnderCapacity) {
      onError(`Salon kapasitesi yetersiz. Toplam kapasite ${totalSelectedCapacity} kişi, kota ${quota} kişi (en az ${quota - CAPACITY_BUFFER} kişilik kapasite gerekli).`);
      return;
    }
    const instructorId = selectedCourse?.instructorId ?? "";
    if (!instructorId) {
      onError("Seçilen derse ait öğretim elemanı bulunamadı.");
      return;
    }
    const effectiveProgramId = isSharedCourse && selectedCourse
      ? selectedCourse.programId
      : programId;

    setLoading(true);
    try {
      if (exam) {
        await updateExam(exam.id, { courseId, date, time, roomIds, supervisorIds, instructorId, programId: effectiveProgramId });
        onSuccess("Sınav güncellendi.");
      } else {
        await createExam({ courseId, date, time, roomIds, supervisorIds, instructorId, programId: effectiveProgramId });
        onSuccess("Sınav eklendi.");
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setLoading(false);
    }
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
          {/* Ders — Autocomplete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ders</label>
            {selectedCourse ? (
              <div className="border border-blue-300 bg-blue-50 rounded-md px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-blue-900">
                      [{selectedCourse.code}] {selectedCourse.name} — Şb.{selectedCourse.section}
                    </p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      {selectedCourse.program.name} · {selectedCourse.instructor.name} · Kota: {selectedCourse.quota} kişi
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={clearCourse}
                    className="text-blue-400 hover:text-blue-700 flex-shrink-0 mt-0.5"
                    title="Dersi değiştir"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <div ref={searchRef} className="relative">
                <input
                  type="text"
                  value={courseSearch}
                  onChange={(e) => { setCourseSearch(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Ders kodu veya adını yazın..."
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm"
                  autoFocus
                />
                {showDropdown && filteredCourses.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-56 overflow-y-auto">
                    {filteredCourses.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectCourse(c)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          [{c.code}] {c.name} — Şb.{c.section}
                        </p>
                        <p className="text-xs text-gray-500">
                          {c.program.name} · {c.instructor.name} · {c.quota} kişi
                        </p>
                      </button>
                    ))}
                  </div>
                )}
                {showDropdown && courseSearch.length >= 1 && filteredCourses.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 px-3 py-2 text-sm text-gray-400">
                    Ders bulunamadı.
                  </div>
                )}
              </div>
            )}
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Derslik(ler)
                {hasSlotSelected && occupiedRoomIds.size > 0 && (
                  <span className="text-xs text-red-500 font-normal ml-2">
                    — {occupiedRoomIds.size} salon bu saatte dolu
                  </span>
                )}
              </label>
              {/* Kapasite özeti */}
              {roomIds.length > 0 && totalSelectedCapacity > 0 && quota > 0 && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                  isUnderCapacity
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}>
                  {totalSelectedCapacity}/{quota} kişi
                </span>
              )}
            </div>

            {assignedRooms.length === 0 ? (
              <p className="text-xs text-gray-400">Kullanılabilir salon bulunmuyor.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {assignedRooms.map((room) => {
                  const isOccupied = occupiedRoomIds.has(room.id);
                  const isReservedByOther = reservedByOtherRoomIds.has(room.id);
                  const isSelected = roomIds.includes(room.id);
                  const reservation = reservationByRoom.get(room.id);
                  const isBlocked = isOccupied || isReservedByOther;

                  const tooltipText = isReservedByOther
                    ? `Bu saatte ${reservation?.fromProgram.name ?? "başka bölüm"} için rezerve`
                    : isOccupied
                    ? "Bu saatte başka sınav var"
                    : room.capacity > 0
                    ? `${room.capacity} kişilik`
                    : undefined;

                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => toggleRoom(room.id)}
                      disabled={isBlocked}
                      title={tooltipText}
                      className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                        isReservedByOther
                          ? "bg-purple-50 border-purple-300 text-purple-400 cursor-not-allowed"
                          : isOccupied
                          ? "bg-red-50 border-red-300 text-red-400 cursor-not-allowed line-through"
                          : isSelected
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {room.name}
                      {room.capacity > 0 && !isBlocked && (
                        <span className={`ml-1 ${isSelected ? "text-blue-200" : "text-gray-400"}`}>
                          ({room.capacity})
                        </span>
                      )}
                      {isReservedByOther && <span className="ml-1">🔒</span>}
                      {isOccupied && !isReservedByOther && " ✕"}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Akıllı salon önerileri */}
            {suggestions.length > 0 && !exam && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">
                  Önerilen salon ataması ({quota} kişi için, ±{CAPACITY_BUFFER} tolerans):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {suggestions.map((s, i) => {
                    const blocked = s.ids.some((id) => occupiedRoomIds.has(id) || reservedByOtherRoomIds.has(id));
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => !blocked && applySuggestion(s.ids)}
                        disabled={blocked}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          blocked
                            ? "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed"
                            : "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                        }`}
                      >
                        {s.names.join(" + ")} ({s.totalCapacity} kişi)
                        {blocked && " ✕"}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {roomIds.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">En az bir derslik seçiniz.</p>
            )}
            {isUnderCapacity && (
              <p className="text-xs text-red-600 font-medium mt-1">
                ⚠ Kapasite yetersiz: {totalSelectedCapacity} / {quota} kişi — en az {quota - CAPACITY_BUFFER} kişilik salon seçilmeli.
              </p>
            )}
          </div>

          {/* Gözetmenler */}
          {isSharedCourse && (
            <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2.5 text-sm text-blue-800">
              Bu Yüksekokul sınavı tüm programlara otomatik eklenir. Her bölüm başkanı kendi gözetmenini ayrıca atar.
            </div>
          )}
          {!isSharedCourse && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gözetmenler
                {roomIds.length > 0 && (
                  <span className={`text-xs font-medium ml-2 px-1.5 py-0.5 rounded ${
                    supervisorIds.length === roomIds.length
                      ? "bg-green-100 text-green-700"
                      : "bg-orange-100 text-orange-700"
                  }`}>
                    {supervisorIds.length}/{roomIds.length} gözetmen
                  </span>
                )}
                {hasSlotSelected && (
                  <span className="text-xs font-normal text-gray-500 ml-2">
                    ({availableInstructors.length} müsait)
                  </span>
                )}
              </label>

              {instructors.length > 0 ? (
                <>
                  {availableInstructors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {availableInstructors.map((instructor) => {
                        const isSelected = supervisorIds.includes(instructor.name);
                        return (
                          <button
                            key={instructor.id}
                            type="button"
                            onClick={() => toggleSupervisor(instructor.name)}
                            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                              isSelected
                                ? "bg-yellow-400 border-yellow-500 text-yellow-900 font-medium"
                                : "bg-white border-gray-300 text-gray-700 hover:bg-yellow-50 hover:border-yellow-300"
                            }`}
                          >
                            {instructor.name}
                            {isSelected && " ✓"}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {hasSlotSelected && unavailableInstructors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {unavailableInstructors.map((instructor) => (
                        <span
                          key={instructor.id}
                          title="Bu saatte başka görevi var"
                          className="px-2.5 py-1 text-xs rounded border bg-gray-50 border-gray-200 text-gray-400 line-through cursor-not-allowed"
                        >
                          {instructor.name}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-gray-400">Bölümünüzde kayıtlı öğretim elemanı yok.</p>
              )}

              {supervisorIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
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
              )}
            </div>
          )}

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
              disabled={loading || isUnderCapacity || (!isSharedCourse && roomIds.length > 0 && supervisorIds.length !== roomIds.length)}
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
