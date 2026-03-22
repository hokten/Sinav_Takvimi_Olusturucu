"use client";

import { useState } from "react";
import { toggleRoomAssignment } from "@/app/actions/roomAssignments";
import { Toast } from "@/components/shared/Toast";

interface Room { id: string; name: string }
interface Program { id: string; name: string; color: string }
interface Assignment { roomId: string; programId: string }

interface Props {
  rooms: Room[];
  programs: Program[];
  assignments: Assignment[];
  onRefresh?: () => void;
}

export function RoomAssignmentsManager({ rooms, programs, assignments: initialAssignments, onRefresh }: Props) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  function isAssigned(roomId: string, programId: string) {
    return assignments.some((a) => a.roomId === roomId && a.programId === programId);
  }

  async function handleToggle(roomId: string, programId: string) {
    const was = isAssigned(roomId, programId);
    // Optimistic update
    if (was) {
      setAssignments((prev) => prev.filter((a) => !(a.roomId === roomId && a.programId === programId)));
    } else {
      setAssignments((prev) => [...prev, { roomId, programId }]);
    }

    try {
      await toggleRoomAssignment(roomId, programId);
      onRefresh?.();
    } catch (err: any) {
      // Revert
      setAssignments(initialAssignments);
      setToast({ message: err.response?.data?.message || err.message || "Hata oluştu.", type: "error" });
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
              {programs.map((prog) => (
                <th
                  key={prog.id}
                  className="px-4 py-2 border border-gray-200 text-center font-medium text-gray-700"
                  style={{ backgroundColor: prog.color + "20" }}
                >
                  <span style={{ color: prog.color }}>{prog.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border border-gray-200 font-medium text-gray-900">{room.name}</td>
                {programs.map((prog) => {
                  const assigned = isAssigned(room.id, prog.id);
                  return (
                    <td key={prog.id} className="px-4 py-2 border border-gray-200 text-center">
                      <button
                        onClick={() => handleToggle(room.id, prog.id)}
                        className={`w-8 h-8 rounded-full border-2 transition-colors ${
                          assigned
                            ? "border-transparent"
                            : "border-gray-300 bg-white hover:border-gray-400"
                        }`}
                        style={assigned ? { backgroundColor: prog.color } : {}}
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
