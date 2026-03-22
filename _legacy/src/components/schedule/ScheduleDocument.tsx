"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { Printer, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { ExamTable } from "@/components/schedule/ExamTable";
import { ExamModal } from "@/components/schedule/ExamModal";
import { SupervisorModal } from "@/components/schedule/SupervisorModal";
import { Toast } from "@/components/shared/Toast";
import { useRealtimeExams } from "@/hooks/useRealtimeExams";
import { updateSharedExamSupervisors, assignSupervisorsToAdminExam } from "@/app/actions/exams";

interface Program { id: string; name: string; color: string; isSharedSource: boolean }
interface ScheduleDay { id: string; date: string; sessions: string[] }
interface Instructor { id: string; name: string; mainProgramId: string }
interface Course { id: string; code: string; name: string; section: number; grade: number; quota: number; instructorId: string; programId: string; adminOnly: boolean; instructor: Instructor; program: Program }
interface Room { id: string; name: string; capacity: number }
interface RoomAssignment { roomId: string; programId: string }
interface DeptSupervisors { programId: string; supervisorIds: string[] }
interface Exam {
  id: string;
  courseId: string;
  date: string;
  time: string;
  roomIds: string[];
  supervisorIds: string[];
  instructorId: string;
  programId: string;
  isShared: boolean;
  deptSupervisors: DeptSupervisors[];
  createdBy: { role: string };
  course: Course;
  instructor: Instructor;
  program: Program;
}
interface ConflictExam {
  id: string;
  courseId: string;
  date: string;
  time: string;
  roomIds: string[];
  supervisorIds: string[];
  instructorId: string;
  programId: string;
  isShared: boolean;
}

interface ApprovedReservation {
  roomId: string;
  date: string;
  time: string;
  fromProgramId: string;
  fromProgram: { name: string; color: string };
}

interface Props {
  programs: Program[];
  editableProgramIds: string[];
  sharedSourceProgramIds: string[];
  scheduleDays: ScheduleDay[];
  exams: Exam[];
  allExams: ConflictExam[];
  rooms: Room[];
  instructors: Instructor[];
  courses: Course[];
  roomAssignments: RoomAssignment[];
  approvedReservations: ApprovedReservation[];
  session: Session;
}

export function ScheduleDocument({
  programs,
  editableProgramIds,
  sharedSourceProgramIds,
  scheduleDays,
  exams: initialExams,
  allExams,
  rooms,
  instructors,
  courses,
  roomAssignments,
  approvedReservations,
  session,
}: Props) {
  const router = useRouter();
  const [exams, setExams] = useState(initialExams);
  const [activeProgramId, setActiveProgramId] = useState(programs[0]?.id ?? "");
  const [showModal, setShowModal] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [supervisorExam, setSupervisorExam] = useState<Exam | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string>("");
  const [prefilledTime, setPrefilledTime] = useState<string>("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showUnscheduled, setShowUnscheduled] = useState(true);

  const isAdmin = session.user.role === "ADMIN";

  useEffect(() => {
    setExams(initialExams);
  }, [initialExams]);

  useRealtimeExams((payload) => {
    if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
      router.refresh();
    } else if (payload.eventType === "DELETE") {
      const oldId = (payload.old as { id?: string }).id;
      if (oldId) {
        setExams((prev) => prev.filter((e) => e.id !== oldId));
        setToast({ message: "Bir sınav silindi.", type: "success" });
      }
    }
  });

  const activeProgram = programs.find((p) => p.id === activeProgramId);

  const scheduledCourseIds = new Set(exams.map((e) => e.courseId));
  const activeProgramCourses = courses.filter((c) => c.programId === activeProgramId);
  const unscheduledCourses = activeProgramCourses.filter((c) => !scheduledCourseIds.has(c.id));

  const activeExams = exams.filter(
    (e) => e.programId === activeProgramId || e.isShared
  );

  function handleAddExam() {
    setEditExam(null);
    setPrefilledDate("");
    setPrefilledTime("");
    setShowModal(true);
  }

  function handleAddAtSlot(date: string, time: string) {
    setEditExam(null);
    setPrefilledDate(date);
    setPrefilledTime(time);
    setShowModal(true);
  }

  function handleEditExam(exam: Exam) {
    setEditExam(exam);
    setShowModal(true);
  }

  function handleEditSupervisors(exam: Exam) {
    setSupervisorExam(exam);
  }

  function handleModalSuccess(message: string) {
    setShowModal(false);
    setToast({ message, type: "success" });
    router.refresh();
  }

  function handleModalError(message: string) {
    setToast({ message, type: "error" });
  }

  function handleDeleteSuccess() {
    setToast({ message: "Sınav silindi.", type: "success" });
    router.refresh();
  }

  function handleSupervisorSuccess(message: string) {
    setSupervisorExam(null);
    setToast({ message, type: "success" });
    router.refresh();
  }

  const canEditProgram = isAdmin || editableProgramIds.includes(activeProgramId);

  const modalCourses = isAdmin
    ? courses
    : courses.filter((c) => editableProgramIds.includes(c.programId));

  const programInstructors = instructors.filter(
    (i) =>
      i.mainProgramId === activeProgramId ||
      (i as { sideProgramIds?: string[] }).sideProgramIds?.includes(activeProgramId)
  );

  return (
    <div>
      <div className="no-print flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {programs.map((program) => (
            <button
              key={program.id}
              onClick={() => setActiveProgramId(program.id)}
              className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                activeProgramId === program.id
                  ? "text-white border-transparent"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
              style={activeProgramId === program.id ? { backgroundColor: program.color, borderColor: program.color } : {}}
            >
              {program.isSharedSource && <span className="mr-1 opacity-80">🔗</span>}
              {program.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {canEditProgram && (
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

      {!isAdmin && unscheduledCourses.length > 0 && (
        <div className="no-print mb-4 bg-amber-50 border border-amber-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowUnscheduled((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BookOpen size={15} />
              <span>Sınav Programına Eklenmeyen Dersler</span>
              <span className="bg-amber-200 text-amber-900 text-xs font-semibold px-2 py-0.5 rounded-full">
                {unscheduledCourses.length}
              </span>
            </div>
            {showUnscheduled ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          {showUnscheduled && (
            <div className="px-4 pb-3 pt-1 flex flex-wrap gap-1.5">
              {unscheduledCourses.map((course) => (
                <span
                  key={course.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border ${
                    course.adminOnly
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-white border-amber-300 text-amber-900"
                  }`}
                >
                  <span className="font-mono font-medium">{course.code}</span>
                  <span>{course.name}</span>
                  <span className="text-amber-600">Şb.{course.section}</span>
                  {course.adminOnly && (
                    <span className="text-red-500 font-medium">(admin)</span>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {!isAdmin && unscheduledCourses.length === 0 && activeProgramCourses.length > 0 && (
        <div className="no-print mb-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-700 flex items-center gap-2">
          <span className="text-green-500">✓</span>
          Tüm dersler sınav programına eklenmiş.
        </div>
      )}

      {activeProgram && (
        <ExamTable
          program={activeProgram}
          editableProgramIds={editableProgramIds}
          scheduleDays={scheduleDays}
          exams={activeExams}
          rooms={rooms}
          session={session}
          onEdit={handleEditExam}
          onEditSupervisors={handleEditSupervisors}
          onAddAtSlot={handleAddAtSlot}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}

      {showModal && (
        <ExamModal
          exam={editExam}
          programId={activeProgramId}
          isAdmin={isAdmin}
          scheduleDays={scheduleDays}
          courses={modalCourses}
          rooms={rooms}
          instructors={instructors}
          roomAssignments={roomAssignments}
          existingExams={allExams}
          approvedReservations={approvedReservations}
          sharedSourceProgramIds={sharedSourceProgramIds}
          initialDate={prefilledDate}
          initialTime={prefilledTime}
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
          onError={handleModalError}
        />
      )}

      {supervisorExam && (
        <SupervisorModal
          exam={supervisorExam}
          instructors={programInstructors}
          existingSupervisors={
            supervisorExam.isShared
              ? (supervisorExam.deptSupervisors.find((ds) => ds.programId === activeProgramId)?.supervisorIds ?? [])
              : supervisorExam.supervisorIds
          }
          onClose={() => setSupervisorExam(null)}
          onSave={async (ids) => {
            if (supervisorExam.isShared) {
              await updateSharedExamSupervisors(supervisorExam.id, activeProgramId, ids);
            } else {
              await assignSupervisorsToAdminExam(supervisorExam.id, ids);
            }
          }}
          onSuccess={handleSupervisorSuccess}
          onError={handleModalError}
        />
      )}

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
