"use client";

import { useState } from "react";

interface Department { id: string; name: string; color: string }
interface ScheduleDay { id: string; date: string; sessions: string[] }
interface Instructor { id: string; name: string; mainDeptId: string; sideDeptIds: string[]; mainDept: Department }
interface Course { id: string; code: string; name: string; section: number }
interface Exam {
  id: string;
  date: string;
  time: string;
  roomIds: string[];
  supervisorIds: string[];
  instructorId: string;
  departmentId: string;
  course: Course;
  instructor: Instructor;
  department: Department;
}

interface Props {
  scheduleDays: ScheduleDay[];
  instructors: Instructor[];
  departments: Department[];
  exams: Exam[];
}

export function InstructorProgramView({ scheduleDays, instructors, departments, exams }: Props) {
  const [activeDayId, setActiveDayId] = useState(scheduleDays[0]?.id ?? "");
  const [instructorFilter, setInstructorFilter] = useState("");

  const activeDay = scheduleDays.find((d) => d.id === activeDayId);
  const filteredInstructors = instructors.filter((i) =>
    i.name.toLowerCase().includes(instructorFilter.toLowerCase())
  );

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d]));

  // For each instructor and session, get their tasks for this day
  function getInstructorTasks(instructorId: string, session: string) {
    if (!activeDay) return { asSupervisor: [], asInstructor: [] };

    const asInstructor = exams.filter(
      (e) => e.date === activeDay.date && e.time === session && e.instructorId === instructorId
    );
    const asSupervisor = exams.filter(
      (e) =>
        e.date === activeDay.date &&
        e.time === session &&
        e.supervisorIds.includes(instructorId) &&
        e.instructorId !== instructorId
    );

    return { asInstructor, asSupervisor };
  }

  return (
    <div className="space-y-4">
      {/* Day tabs */}
      <div className="flex gap-2 flex-wrap">
        {scheduleDays.map((day) => (
          <button
            key={day.id}
            onClick={() => setActiveDayId(day.id)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              activeDayId === day.id
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {day.date}
          </button>
        ))}
      </div>

      {/* Instructor filter */}
      <div>
        <input
          type="text"
          value={instructorFilter}
          onChange={(e) => setInstructorFilter(e.target.value)}
          placeholder="Hoca filtrele..."
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-48"
        />
      </div>

      {!activeDay ? (
        <p className="text-gray-400 text-sm">Henüz sınav günü tanımlanmamış.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="text-xs border-collapse w-full">
            <thead>
              <tr>
                <th className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium text-gray-700 sticky left-0 z-10 min-w-[180px] text-left">
                  Hoca
                </th>
                {activeDay.sessions.map((session) => (
                  <th
                    key={session}
                    className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium text-gray-700 min-w-[160px]"
                  >
                    {session}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInstructors.map((instructor) => {
                const mainDept = deptMap[instructor.mainDeptId];
                const sideDepts = instructor.sideDeptIds
                  .map((id) => deptMap[id])
                  .filter(Boolean);

                // Check if instructor has any conflict (multiple tasks in same session)
                let hasAnyConflict = false;

                return (
                  <tr key={instructor.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-3 py-2 sticky left-0 bg-white">
                      <p className="font-medium text-gray-900">{instructor.name}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {mainDept && (
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
                            style={{ backgroundColor: mainDept.color + "20", color: mainDept.color }}
                          >
                            {mainDept.name}
                          </span>
                        )}
                        {sideDepts.map((dept) => dept && (
                          <span
                            key={dept.id}
                            className="inline-block px-1.5 py-0.5 rounded text-xs"
                            style={{ backgroundColor: dept.color + "15", color: dept.color, border: `1px solid ${dept.color}40` }}
                          >
                            {dept.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    {activeDay.sessions.map((session) => {
                      const { asInstructor, asSupervisor } = getInstructorTasks(instructor.id, session);
                      const totalTasks = asInstructor.length + asSupervisor.length;
                      const hasConflict = totalTasks > 1;
                      if (hasConflict) hasAnyConflict = true;

                      return (
                        <td
                          key={session}
                          className={`border border-gray-200 px-2 py-1.5 align-top ${hasConflict ? "bg-red-50" : ""}`}
                        >
                          {hasConflict && (
                            <p className="text-red-600 text-xs font-bold mb-1">⚠ ÇAKIŞMA</p>
                          )}
                          {asInstructor.map((exam) => {
                            const dept = deptMap[exam.departmentId];
                            return (
                              <div
                                key={exam.id}
                                className="rounded px-1.5 py-1 mb-1"
                                style={{
                                  backgroundColor: (dept?.color ?? "#6B7280") + "20",
                                  borderLeft: `3px solid ${dept?.color ?? "#6B7280"}`,
                                }}
                              >
                                <p className="font-mono font-semibold">{exam.course.code}</p>
                                <p className="text-gray-600 truncate">{exam.course.name}</p>
                                <p className="text-xs" style={{ color: dept?.color }}>
                                  {dept?.name}
                                </p>
                              </div>
                            );
                          })}
                          {asSupervisor.map((exam) => {
                            return (
                              <div
                                key={`sup-${exam.id}`}
                                className="rounded px-1.5 py-1 mb-1 bg-yellow-50 border border-yellow-300"
                              >
                                <p className="font-mono font-semibold text-yellow-800">{exam.course.code}</p>
                                <p className="text-yellow-700 text-xs">GÖZETİM</p>
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
