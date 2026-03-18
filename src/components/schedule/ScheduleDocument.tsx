"use client";

import { useState } from "react";
import type { Session } from "next-auth";
import { Printer } from "lucide-react";
import { ExamTable } from "@/components/schedule/ExamTable";
import { ExamModal } from "@/components/schedule/ExamModal";
import { Toast } from "@/components/shared/Toast";
import { useRealtimeExams } from "@/hooks/useRealtimeExams";

interface Department { id: string; name: string; color: string }
interface ScheduleDay { id: string; date: string; sessions: string[] }
interface Instructor { id: string; name: string; mainDeptId: string }
interface Course { id: string; code: string; name: string; section: number; grade: number; instructorId: string; departmentId: string; adminOnly: boolean; instructor: Instructor }
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
  course: Course;
  instructor: Instructor;
  department: Department;
}

interface Props {
  departments: Department[];
  scheduleDays: ScheduleDay[];
  exams: Exam[];
  rooms: Room[];
  instructors: Instructor[];
  courses: Course[];
  roomAssignments: RoomAssignment[];
  session: Session;
}

export function ScheduleDocument({
  departments,
  scheduleDays,
  exams: initialExams,
  rooms,
  instructors,
  courses,
  roomAssignments,
  session,
}: Props) {
  const [exams, setExams] = useState(initialExams);
  const [activeDeptId, setActiveDeptId] = useState(departments[0]?.id ?? "");
  const [showModal, setShowModal] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const isAdmin = session.user.role === "ADMIN";

  useRealtimeExams((payload) => {
    if (payload.eventType === "INSERT") {
      // Trigger a page reload to fetch fresh data
      window.location.reload();
    } else if (payload.eventType === "DELETE") {
      const oldId = (payload.old as { id?: string }).id;
      if (oldId) {
        setExams((prev) => prev.filter((e) => e.id !== oldId));
        setToast({ message: "Bir sınav silindi.", type: "success" });
      }
    } else if (payload.eventType === "UPDATE") {
      window.location.reload();
    }
  });

  const activeDept = departments.find((d) => d.id === activeDeptId);

  function handleAddExam() {
    setEditExam(null);
    setShowModal(true);
  }

  function handleEditExam(exam: Exam) {
    setEditExam(exam);
    setShowModal(true);
  }

  function handleModalSuccess(message: string) {
    setShowModal(false);
    setToast({ message, type: "success" });
    // Reload to get fresh data
    setTimeout(() => window.location.reload(), 500);
  }

  function handleModalError(message: string) {
    setToast({ message, type: "error" });
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="no-print flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setActiveDeptId(dept.id)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                activeDeptId === dept.id
                  ? "text-white border-transparent"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              style={activeDeptId === dept.id ? { backgroundColor: dept.color, borderColor: dept.color } : {}}
            >
              {dept.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(isAdmin || session.user.departmentId === activeDeptId) && (
            <button
              onClick={handleAddExam}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              + Sınav Ekle
            </button>
          )}
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1.5"
          >
            <Printer size={14} />
            Yazdır
          </button>
        </div>
      </div>

      {/* Document */}
      {activeDept && (
        <ExamTable
          department={activeDept}
          scheduleDays={scheduleDays}
          exams={exams.filter((e) => e.departmentId === activeDeptId)}
          rooms={rooms}
          session={session}
          onEdit={handleEditExam}
        />
      )}

      {/* Modal */}
      {showModal && (
        <ExamModal
          exam={editExam}
          departmentId={activeDeptId}
          scheduleDays={scheduleDays}
          courses={courses.filter((c) => isAdmin || c.departmentId === activeDeptId)}
          rooms={rooms}
          instructors={instructors}
          roomAssignments={roomAssignments}
          existingExams={exams}
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
          onError={handleModalError}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
