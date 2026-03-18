"use client";

import { useState } from "react";

interface Department { id: string; name: string; color: string }
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
  departmentId: string;
  course: Course;
  instructor: Instructor;
  department: Department;
}

interface Props {
  scheduleDays: ScheduleDay[];
  rooms: Room[];
  departments: Department[];
  exams: Exam[];
}

export function RoomProgramView({ scheduleDays, rooms, departments, exams }: Props) {
  const [activeDayId, setActiveDayId] = useState(scheduleDays[0]?.id ?? "");
  const [roomFilter, setRoomFilter] = useState("");

  const activeDay = scheduleDays.find((d) => d.id === activeDayId);
  const filteredRooms = rooms.filter((r) =>
    r.name.toLowerCase().includes(roomFilter.toLowerCase())
  );

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d]));

  // Find exams for this day
  const dayExams = exams.filter((e) => activeDay && e.date === activeDay.date);

  // Check conflicts: same room + same time
  function getExamsInRoom(roomId: string, time: string) {
    return dayExams.filter((e) => e.time === time && e.roomIds.includes(roomId));
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

      {/* Room filter */}
      <div>
        <input
          type="text"
          value={roomFilter}
          onChange={(e) => setRoomFilter(e.target.value)}
          placeholder="Salon filtrele..."
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
                <th className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium text-gray-700 sticky left-0 z-10 min-w-[80px]">
                  Oturum
                </th>
                {filteredRooms.map((room) => (
                  <th
                    key={room.id}
                    className="border border-gray-200 px-3 py-2 bg-gray-50 font-medium text-gray-700 min-w-[130px]"
                  >
                    {room.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeDay.sessions.map((session) => (
                <tr key={session}>
                  <td className="border border-gray-200 px-3 py-2 font-medium text-gray-700 bg-gray-50 text-center sticky left-0">
                    {session}
                  </td>
                  {filteredRooms.map((room) => {
                    const cellExams = getExamsInRoom(room.id, session);
                    const hasConflict = cellExams.length > 1;

                    return (
                      <td
                        key={room.id}
                        className={`border border-gray-200 px-2 py-1.5 align-top ${
                          hasConflict ? "bg-red-50" : ""
                        }`}
                      >
                        {hasConflict && (
                          <p className="text-red-600 text-xs font-medium mb-1">⚠ ÇAKIŞMA</p>
                        )}
                        {cellExams.map((exam) => {
                          const dept = deptMap[exam.departmentId];
                          return (
                            <div
                              key={exam.id}
                              className="rounded px-1.5 py-1 mb-1 text-xs"
                              style={{
                                backgroundColor: (dept?.color ?? "#6B7280") + "20",
                                borderLeft: `3px solid ${dept?.color ?? "#6B7280"}`,
                              }}
                            >
                              <p className="font-mono font-semibold">{exam.course.code}</p>
                              <p className="text-gray-600 truncate">{exam.course.name}</p>
                              <p className="text-gray-500">{exam.instructor.name}</p>
                              <p
                                className="text-xs font-medium mt-0.5"
                                style={{ color: dept?.color }}
                              >
                                {dept?.name}
                              </p>
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
