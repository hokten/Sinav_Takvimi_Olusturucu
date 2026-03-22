"use client";

import { X } from "lucide-react";

interface Program { id: string; name: string; color: string }
interface Course { id: string; code: string; name: string; section: number }
interface Instructor { id: string; name: string; mainProgramId: string; sideProgramIds: string[]; mainProgram: Program }
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

interface Props {
  instructor: Instructor;
  exams: Exam[];
  programs: Record<string, Program>;
  onClose: () => void;
}

export function InstructorScheduleModal({ instructor, exams, programs, onClose }: Props) {
  const instructorExams = exams
    .filter((e) => e.instructorId === instructor.id || e.supervisorIds.includes(instructor.id))
    .sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

  const mainProgram = programs[instructor.mainProgramId];
  const sidePrograms = instructor.sideProgramIds.map((id) => programs[id]).filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="text-base font-semibold">{instructor.name}</h2>
            <div className="flex flex-wrap gap-1 mt-1">
              {mainProgram && (
                <span
                  className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                  style={{ backgroundColor: mainProgram.color + "20", color: mainProgram.color }}
                >
                  {mainProgram.name} (Ana)
                </span>
              )}
              {sidePrograms.map((prog) => prog && (
                <span
                  key={prog.id}
                  className="inline-block px-2 py-0.5 rounded text-xs"
                  style={{ backgroundColor: prog.color + "15", color: prog.color, border: `1px solid ${prog.color}40` }}
                >
                  {prog.name}
                </span>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4">
          {instructorExams.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Bu öğretim elemanına ait görev bulunmuyor.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  {["Tarih", "Saat", "Ders", "Görev", "Derslik"].map((h) => (
                    <th key={h} className="border border-gray-200 px-3 py-2 bg-gray-50 text-left font-medium text-gray-700">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {instructorExams.map((exam) => {
                  const isInstructor = exam.instructorId === instructor.id;
                  const isSupervisor = exam.supervisorIds.includes(instructor.id);
                  const prog = programs[exam.programId];

                  return (
                    <tr key={`${exam.id}-${isInstructor ? "inst" : "sup"}`} className="hover:bg-gray-50">
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap">{exam.date}</td>
                      <td className="border border-gray-200 px-3 py-2 whitespace-nowrap font-medium">{exam.time}</td>
                      <td className="border border-gray-200 px-3 py-2">
                        <p className="font-mono font-semibold text-xs">{exam.course.code}</p>
                        <p className="text-gray-600 text-xs">{exam.course.name} Şb.{exam.course.section}</p>
                      </td>
                      <td className="border border-gray-200 px-3 py-2">
                        {isInstructor && (
                          <span
                            className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: (prog?.color ?? "#6B7280") + "20", color: prog?.color ?? "#6B7280" }}
                          >
                            Ders Sorumlusu
                          </span>
                        )}
                        {isSupervisor && !isInstructor && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                            Gözetmen
                          </span>
                        )}
                        {isInstructor && isSupervisor && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300 ml-1">
                            + Gözetmen
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-200 px-3 py-2 text-xs text-gray-500">
                        {exam.roomIds.join(", ")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
