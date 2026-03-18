"use client";

import { useState } from "react";
import { toggleRoomAssignment } from "@/app/actions/roomAssignments";
import { Toast } from "@/components/shared/Toast";

interface Room { id: string; name: string }
interface Department { id: string; name: string; color: string }
interface Assignment { roomId: string; departmentId: string }

interface Props {
  rooms: Room[];
  departments: Department[];
  assignments: Assignment[];
}

export function RoomAssignmentsManager({ rooms, departments, assignments: initialAssignments }: Props) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function isAssigned(roomId: string, departmentId: string) {
    return assignments.some((a) => a.roomId === roomId && a.departmentId === departmentId);
  }

  async function handleToggle(roomId: string, departmentId: string) {
    const was = isAssigned(roomId, departmentId);
    // Optimistic update
    if (was) {
      setAssignments((prev) => prev.filter((a) => !(a.roomId === roomId && a.departmentId === departmentId)));
    } else {
      setAssignments((prev) => [...prev, { roomId, departmentId }]);
    }

    try {
      await toggleRoomAssignment(roomId, departmentId);
    } catch (err) {
      // Revert
      setAssignments(initialAssignments);
      setToast({ message: err instanceof Error ? err.message : "Hata oluştu.", type: "error" });
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="text-left px-4 py-2 bg-gray-50 border border-gray-200 font-medium text-gray-700 w-32">
                Salon
              </th>
              {departments.map((dept) => (
                <th
                  key={dept.id}
                  className="px-4 py-2 border border-gray-200 text-center font-medium text-gray-700"
                  style={{ backgroundColor: dept.color + "20" }}
                >
                  <span style={{ color: dept.color }}>{dept.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border border-gray-200 font-medium text-gray-900">{room.name}</td>
                {departments.map((dept) => {
                  const assigned = isAssigned(room.id, dept.id);
                  return (
                    <td key={dept.id} className="px-4 py-2 border border-gray-200 text-center">
                      <button
                        onClick={() => handleToggle(room.id, dept.id)}
                        className={`w-8 h-8 rounded-full border-2 transition-colors ${
                          assigned
                            ? "border-transparent"
                            : "border-gray-300 bg-white hover:border-gray-400"
                        }`}
                        style={assigned ? { backgroundColor: dept.color } : {}}
                        title={assigned ? "Kaldır" : "Ata"}
                      >
                        {assigned && (
                          <span className="text-white text-xs font-bold">✓</span>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
