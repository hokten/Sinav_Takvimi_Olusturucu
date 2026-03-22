"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InstructorScheduleModal } from "@/components/program/InstructorScheduleModal";
import { useRealtimeExams } from "@/hooks/useRealtimeExams";

interface Program { id: string; name: string; color: string }
interface ScheduleDay { id: string; date: string; sessions: string[] }
interface Instructor { id: string; name: string; mainProgramId: string; sideProgramIds: string[]; mainProgram: Program }
interface Course { id: string; code: string; name: string; section: number }
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

interface Room { id: string; name: string }

interface Props {
  scheduleDays: ScheduleDay[];
  instructors: Instructor[];
  programs: Program[];
  exams: Exam[];
  rooms: Room[];
}

export function InstructorProgramView({ scheduleDays, instructors, programs, exams, rooms }: Props) {
  const router = useRouter();
  useRealtimeExams(() => router.refresh());

  const [query, setQuery] = useState("");
  const [pickedInstructor, setPickedInstructor] = useState<Instructor | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = query.trim()
    ? instructors.filter((i) => i.name.toLowerCase().includes(query.toLowerCase()))
    : instructors;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(instructor: Instructor) {
    setPickedInstructor(instructor);
    setQuery(instructor.name);
    setDropdownOpen(false);
  }

  function handleClear() {
    setPickedInstructor(null);
    setQuery("");
    inputRef.current?.focus();
  }

  const visibleInstructors = pickedInstructor ? [pickedInstructor] : [];

  const programMap = Object.fromEntries(programs.map((p) => [p.id, p]));
  const roomMap = Object.fromEntries(rooms.map((r) => [r.id, r]));

  // Build all (date, session) pairs ordered by date then session
  const allSlots: { date: string; session: string; dayId: string }[] = [];
  for (const day of scheduleDays) {
    const sorted = [...day.sessions].sort();
    for (const session of sorted) {
      allSlots.push({ date: day.date, session, dayId: day.id });
    }
  }

  function getInstructorTasks(instructorId: string, date: string, session: string) {
    const asInstructor = exams.filter(
      (e) => e.date === date && e.time === session && e.instructorId === instructorId
    );
    const asSupervisor = exams.filter(
      (e) =>
        e.date === date &&
        e.time === session &&
        e.supervisorIds.includes(instructorId) &&
        e.instructorId !== instructorId
    );
    return { asInstructor, asSupervisor };
  }

  if (scheduleDays.length === 0) {
    return <p className="text-gray-400 text-sm">Henüz sınav günü tanımlanmamış.</p>;
  }

  // Group slots by date for column header grouping
  const dateGroups = scheduleDays.map((day) => ({
    date: day.date,
    sessions: [...day.sessions].sort(),
  }));

  return (
    <div className="space-y-4">
      {/* Instructor autocomplete select */}
      <div className="flex items-center gap-3">
        <div ref={containerRef} className="relative">
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-72 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPickedInstructor(null);
                setDropdownOpen(true);
              }}
              onFocus={() => setDropdownOpen(true)}
              placeholder="Hoca seçin veya arayın..."
              className="flex-1 px-3 py-1.5 text-sm outline-none bg-transparent"
            />
            {pickedInstructor && (
              <button
                onClick={handleClear}
                className="px-2 text-gray-400 hover:text-gray-700 text-base leading-none"
                title="Temizle"
              >
                ×
              </button>
            )}
          </div>
          {dropdownOpen && (
            <ul className="absolute z-50 top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              {suggestions.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-400">Sonuç bulunamadı</li>
              ) : (
                suggestions.map((instructor) => (
                  <li
                    key={instructor.id}
                    onMouseDown={() => handleSelect(instructor)}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${
                      pickedInstructor?.id === instructor.id ? "bg-blue-50 font-medium" : ""
                    }`}
                  >
                    {instructor.name}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        {!pickedInstructor && (
          <span className="text-xs text-gray-400">Bireysel takvim için hoca seçin</span>
        )}
      </div>

      {!pickedInstructor ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-lg border border-gray-200 border-dashed">
          <p className="text-gray-400 text-sm">Yukarıdan bir hoca seçin</p>
        </div>
      ) : (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Instructor header */}
        {visibleInstructors.map((instructor) => {
          const mainProgram = programMap[instructor.mainProgramId];
          const sidePrograms = instructor.sideProgramIds.map((id) => programMap[id]).filter(Boolean);
          return (
            <div
              key={instructor.id}
              className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => setSelectedInstructor(instructor)}
              title="Tüm takvimi görüntüle"
            >
              <p className="font-medium text-gray-900 hover:text-blue-700 text-sm">{instructor.name}</p>
              <div className="flex flex-wrap gap-1">
                {mainProgram && (
                  <span
                    className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
                    style={{ backgroundColor: mainProgram.color + "20", color: mainProgram.color }}
                  >
                    {mainProgram.name}
                  </span>
                )}
                {sidePrograms.map((prog) => prog && (
                  <span
                    key={prog.id}
                    className="inline-block px-1.5 py-0.5 rounded text-xs"
                    style={{ backgroundColor: prog.color + "15", color: prog.color, border: `1px solid ${prog.color}40` }}
                  >
                    {prog.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}

        {/* Vertical schedule table */}
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr>
              <th className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium text-gray-700 text-left w-28">
                Tarih
              </th>
              <th className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium text-gray-700 text-left w-16">
                Saat
              </th>
              <th className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium text-gray-700 text-left">
                Ders / Ders Kodu
              </th>
              <th className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium text-gray-700 text-left w-32">
                Program
              </th>
              <th className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium text-gray-700 text-left w-28">
                Derslik
              </th>
            </tr>
          </thead>
          <tbody>
            {dateGroups.map((group) =>
              group.sessions.map((session, sIdx) => {
                const instructor = visibleInstructors[0];
                if (!instructor) return null;
                const { asInstructor, asSupervisor } = getInstructorTasks(instructor.id, group.date, session);
                const totalTasks = asInstructor.length + asSupervisor.length;
                const hasConflict = totalTasks > 1;

                return (
                  <tr key={`${group.date}-${session}`} className="hover:bg-gray-50">
                    {sIdx === 0 && (
                      <td
                        rowSpan={group.sessions.length}
                        className="border border-gray-200 px-3 py-2 bg-blue-50 font-semibold text-blue-800 text-center align-middle"
                      >
                        {group.date}
                      </td>
                    )}
                    <td className="border border-gray-200 px-3 py-2 text-gray-600 font-medium whitespace-nowrap align-top">
                      {session}
                    </td>
                    {/* Ders / Ders Kodu */}
                    <td className={`border border-gray-200 px-2 py-1.5 align-top ${hasConflict ? "bg-red-50" : ""}`}>
                      {hasConflict && (
                        <p className="text-red-600 text-xs font-bold mb-1">⚠ ÇAKIŞMA</p>
                      )}
                      {totalTasks === 0 ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <div className="space-y-1">
                          {asInstructor.map((exam) => (
                            <div key={exam.id}>
                              <p className="font-mono font-semibold">{exam.course.code}</p>
                              <p className="text-gray-600">{exam.course.name} Şb.{exam.course.section}</p>
                            </div>
                          ))}
                          {asSupervisor.map((exam) => (
                            <div key={`sup-${exam.id}`}>
                              <p className="font-mono font-semibold text-yellow-800">{exam.course.code}</p>
                              <p className="text-yellow-700">{exam.course.name} Şb.{exam.course.section}</p>
                              <span className="inline-block px-1 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800 border border-yellow-300">GÖZETİM</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                    {/* Program */}
                    <td className={`border border-gray-200 px-2 py-1.5 align-top ${hasConflict ? "bg-red-50" : ""}`}>
                      {totalTasks === 0 ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <div className="space-y-1">
                          {asInstructor.map((exam) => {
                            const prog = programMap[exam.programId];
                            return prog ? (
                              <span
                                key={exam.id}
                                className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
                                style={{ backgroundColor: prog.color + "20", color: prog.color }}
                              >
                                {prog.name}
                              </span>
                            ) : null;
                          })}
                          {asSupervisor.map((exam) => {
                            const prog = programMap[exam.programId];
                            return prog ? (
                              <span
                                key={`sup-${exam.id}`}
                                className="inline-block px-1.5 py-0.5 rounded text-xs"
                                style={{ backgroundColor: prog.color + "15", color: prog.color, border: `1px solid ${prog.color}40` }}
                              >
                                {prog.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}
                    </td>
                    {/* Derslik */}
                    <td className={`border border-gray-200 px-2 py-1.5 align-top ${hasConflict ? "bg-red-50" : ""}`}>
                      {totalTasks === 0 ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <div className="space-y-1">
                          {asInstructor.map((exam) => (
                            <p key={exam.id} className="text-gray-600">
                              {exam.roomIds.map((rid) => roomMap[rid]?.name ?? rid).join(", ")}
                            </p>
                          ))}
                          {asSupervisor.map((exam) => (
                            <p key={`sup-${exam.id}`} className="text-gray-600">
                              {exam.roomIds.map((rid) => roomMap[rid]?.name ?? rid).join(", ")}
                            </p>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      {selectedInstructor && (
        <InstructorScheduleModal
          instructor={selectedInstructor}
          exams={exams}
          programs={programMap}
          onClose={() => setSelectedInstructor(null)}
        />
      )}
    </div>
  );
}
