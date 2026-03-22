"use client";

import { useState } from "react";
import type { Session } from "next-auth";
import { deleteExam } from "@/app/actions/exams";
import { Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

interface Program { id: string; name: string; color: string; isSharedSource: boolean }
interface ScheduleDay { id: string; date: string; sessions: string[] }
interface Instructor { id: string; name: string; mainProgramId: string }
interface Course { id: string; code: string; name: string; section: number; grade: number; quota: number; instructorId: string; programId: string; adminOnly: boolean; instructor: Instructor; program: Program }
interface Room { id: string; name: string; capacity: number }
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

interface Props {
  program: Program;
  editableProgramIds: string[];
  scheduleDays: ScheduleDay[];
  exams: Exam[];
  rooms: Room[];
  session: Session;
  onEdit: (exam: Exam) => void;
  onEditSupervisors: (exam: Exam) => void;
  onAddAtSlot?: (date: string, time: string) => void;
  onDeleteSuccess?: () => void;
}

const DAYS_TR = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

function parseDate(dateStr: string): Date {
  const [day, month, year] = dateStr.split(".").map(Number);
  return new Date(year, month - 1, day);
}

function getDayName(dateStr: string): string {
  return DAYS_TR[parseDate(dateStr).getDay()];
}

function isBeforeNoon(time: string): boolean {
  const [h] = time.split(":").map(Number);
  return h < 12;
}

export function ExamTable({ program, editableProgramIds, scheduleDays, exams, rooms, session, onEdit, onEditSupervisors, onAddAtSlot, onDeleteSuccess }: Props) {
  const isAdmin = session.user.role === "ADMIN";
  const canEdit = isAdmin || editableProgramIds.includes(program.id);

  const roomMap = Object.fromEntries(rooms.map((r) => [r.id, r.name]));

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteExam(deleteTarget);
      setDeleteTarget(null);
      onDeleteSuccess?.();
    } catch (err) {
      setDeleteTarget(null);
      alert(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setDeleting(false);
    }
  }

  // Bir sınav için gösterilecek gözetmen listesi
  // Paylaşımlı sınavlarda bu bölüme ait gözetmenler gösterilir
  function getSupervisors(exam: Exam): string[] {
    if (exam.isShared) {
      return exam.deptSupervisors.find((ds) => ds.programId === program.id)?.supervisorIds ?? [];

    }
    return exam.supervisorIds;
  }

  const colSpanTotal = canEdit ? 9 : 8;

  return (
    <div className="bg-white" id="print-document">
      {/* Document Header */}
      <div className="text-center py-4 border-b border-black" style={{ printColorAdjust: "exact" }}>
        <p className="text-sm font-medium">T.C.</p>
        <p className="text-sm font-medium">AMASYA ÜNİVERSİTESİ</p>
        <p className="text-sm">Amasya Teknik Bilimler Meslek Yüksekokulu</p>
        <p className="text-sm font-semibold mt-1">{program.name} Programı</p>
        <p className="text-sm mt-0.5">2024-2025 Eğitim-Öğretim Yılı Bahar Dönemi Final Sınav Takvimi</p>
      </div>

      {/* Table */}
      <table className="w-full border-collapse text-xs" style={{ borderColor: "black" }}>
        <thead>
          <tr>
            {["Tarih", "Gün", "Saat", "Dersin Kodu", "Dersin Adı", "Dersin Öğretim Elemanı", "Derslik", "Görevli"].map(
              (h) => {
                const isVertical = ["Tarih", "Gün", "Saat"].includes(h);
                return (
                  <th
                    key={h}
                    className="border border-black bg-gray-100 text-center font-semibold"
                    style={{
                      borderColor: "black",
                      ...(isVertical
                        ? { writingMode: "vertical-lr", transform: "rotate(180deg)", padding: "6px 4px", whiteSpace: "nowrap" }
                        : { padding: "4px 8px" }),
                    }}
                  >
                    {h}
                  </th>
                );
              }
            )}
            {canEdit && <th className="no-print border border-black bg-gray-100 px-2 py-1">İşlem</th>}
          </tr>
        </thead>
        <tbody>
          {scheduleDays.length === 0 ? (
            <tr>
              <td colSpan={colSpanTotal} className="text-center py-8 text-gray-400 border border-black">
                Henüz sınav günü tanımlanmamış.
              </td>
            </tr>
          ) : (
            (() => {
              const rows: React.ReactNode[] = [];
              let dayIndex = 0;

              for (const day of scheduleDays) {
                const isEvenDay = dayIndex % 2 === 0;
                const dayBg = isEvenDay ? "#ffffff" : "#f0f0f0";
                const lunchBg = isEvenDay ? "#d4d4d4" : "#ffffff";
                const dayTopBorder = "2.5px solid black";

                const sortedSessions = [...day.sessions].sort();
                const morningSessions = sortedSessions.filter((s) => isBeforeNoon(s));
                const afternoonSessions = sortedSessions.filter((s) => !isBeforeNoon(s));
                const hasLunch = morningSessions.length > 0 && afternoonSessions.length > 0;

                if (sortedSessions.length === 0) {
                  rows.push(
                    <tr key={`empty-${day.date}`}>
                      <td
                        className="border border-black px-1 text-center font-medium"
                        style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", borderColor: "black", minWidth: "26px", borderTop: dayTopBorder, backgroundColor: dayBg }}
                      >
                        {day.date}
                      </td>
                      <td className="border border-black px-1 text-center" style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", borderColor: "black", borderTop: dayTopBorder, backgroundColor: dayBg }}>
                        {getDayName(day.date)}
                      </td>
                      <td colSpan={colSpanTotal - 2} className="border border-black px-2 py-2 text-center text-gray-400" style={{ borderColor: "black", borderTop: dayTopBorder, backgroundColor: dayBg }}>
                        Bu gün için oturum tanımlanmamış
                      </td>
                    </tr>
                  );
                  dayIndex++;
                  continue;
                }

                const totalDayRows = sortedSessions.length + (hasLunch ? 1 : 0);
                let isFirstRowOfDay = true;

                const renderSessionRows = (sessions: string[]) => {
                  for (const sessionTime of sessions) {
                    const sessionExams = exams.filter(
                      (e) => e.date === day.date && e.time === sessionTime
                    );
                    const topBorder = isFirstRowOfDay ? dayTopBorder : undefined;

                    if (sessionExams.length === 0) {
                      rows.push(
                        <tr key={`slot-${day.date}-${sessionTime}`} style={{ backgroundColor: dayBg }}>
                          {isFirstRowOfDay && (
                            <td
                              rowSpan={totalDayRows}
                              className="border border-black px-1 text-center font-medium align-middle"
                              style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", borderColor: "black", minWidth: "26px", borderTop: topBorder, backgroundColor: dayBg }}
                            >
                              {day.date}
                            </td>
                          )}
                          {isFirstRowOfDay && (
                            <td
                              rowSpan={totalDayRows}
                              className="border border-black px-1 text-center align-middle"
                              style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", borderColor: "black", borderTop: topBorder, backgroundColor: dayBg }}
                            >
                              {getDayName(day.date)}
                            </td>
                          )}
                          <td className="border border-black px-1 py-1 text-center whitespace-nowrap" style={{ borderColor: "black", borderTop: topBorder, backgroundColor: dayBg, minWidth: "42px" }}>
                            {sessionTime}
                          </td>
                          <td
                            colSpan={5}
                            className="border border-black px-2 py-1 text-gray-300"
                            style={{ borderColor: "black", borderTop: topBorder, backgroundColor: dayBg }}
                          >
                            {canEdit && onAddAtSlot && (
                              <button
                                onClick={() => onAddAtSlot(day.date, sessionTime)}
                                className="no-print flex items-center gap-1 text-xs text-blue-400 hover:text-blue-600 transition-colors"
                              >
                                <Plus size={12} />
                                Sınav Ekle
                              </button>
                            )}
                          </td>
                          {canEdit && (
                            <td className="no-print border border-black px-2 py-1" style={{ borderColor: "black", borderTop: topBorder, backgroundColor: dayBg }} />
                          )}
                        </tr>
                      );
                      isFirstRowOfDay = false;
                    } else {
                      for (let i = 0; i < sessionExams.length; i++) {
                        const exam = sessionExams[i];
                        const showDateDay = isFirstRowOfDay && i === 0;
                        const supervisors = getSupervisors(exam);
                        const cellTopBorder = showDateDay ? dayTopBorder : undefined;
                        const cellBg = exam.isShared ? "#faf5ff" : dayBg;

                        // Aksiyon butonları belirleme
                        const isAdminManaged = !exam.isShared && exam.createdBy.role === "ADMIN";
                        let actionCell: React.ReactNode = null;
                        if (canEdit) {
                          if (exam.isShared) {
                            if (isAdmin) {
                              // Admin: düzenle ve sil
                              actionCell = (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => onEdit(exam)}
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Düzenle
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(exam.id)}
                                    className="text-xs text-red-600 hover:underline"
                                  >
                                    Sil
                                  </button>
                                </div>
                              );
                            } else {
                              // Bölüm başkanı: sadece gözetmen atayabilir (shared)
                              const hasSupervisors = supervisors.length > 0;
                              actionCell = (
                                <button
                                  onClick={() => onEditSupervisors(exam)}
                                  className={`text-xs hover:underline ${
                                    hasSupervisors ? "text-yellow-600" : "text-amber-500 font-medium"
                                  }`}
                                >
                                  {hasSupervisors ? "Gözetmen Düzenle" : "Gözetmen Ata ⚠"}
                                </button>
                              );
                            }
                          } else if (isAdminManaged) {
                            if (isAdmin) {
                              // Admin: düzenle ve sil
                              actionCell = (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => onEdit(exam)}
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    Düzenle
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(exam.id)}
                                    className="text-xs text-red-600 hover:underline"
                                  >
                                    Sil
                                  </button>
                                </div>
                              );
                            } else if (exam.supervisorIds.length === 0) {
                              // Bölüm başkanı: admin gözetmen bırakmamışsa sadece gözetmen atayabilir
                              actionCell = (
                                <button
                                  onClick={() => onEditSupervisors(exam)}
                                  className="text-xs text-amber-500 font-medium hover:underline"
                                >
                                  Gözetmen Ata ⚠
                                </button>
                              );
                            }
                            // else: admin gözetmenleri doldurmuş, bölüm başkanı read-only
                          } else if (isAdmin || (!exam.course.adminOnly && editableProgramIds.includes(exam.programId))) {
                            actionCell = (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => onEdit(exam)}
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  Düzenle
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(exam.id)}
                                  className="text-xs text-red-600 hover:underline"
                                >
                                  Sil
                                </button>
                              </div>
                            );
                          }
                        }

                        rows.push(
                          <tr key={exam.id} style={{ backgroundColor: cellBg }}>
                            {showDateDay && (
                              <td
                                rowSpan={totalDayRows}
                                className="border border-black px-1 text-center font-medium align-middle"
                                style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", borderColor: "black", minWidth: "26px", borderTop: cellTopBorder, backgroundColor: dayBg }}
                              >
                                {day.date}
                              </td>
                            )}
                            {showDateDay && (
                              <td
                                rowSpan={totalDayRows}
                                className="border border-black px-1 text-center align-middle"
                                style={{ writingMode: "vertical-lr", transform: "rotate(180deg)", borderColor: "black", borderTop: cellTopBorder, backgroundColor: dayBg }}
                              >
                                {getDayName(day.date)}
                              </td>
                            )}
                            <td className="border border-black px-1 py-1 text-center whitespace-nowrap" style={{ borderColor: "black", borderTop: cellTopBorder, backgroundColor: cellBg, minWidth: "42px" }}>
                              {sessionTime}
                            </td>
                            <td className="border border-black px-2 py-1 font-mono" style={{ borderColor: "black", borderTop: cellTopBorder, backgroundColor: cellBg }}>
                              {exam.course.code}
                              {exam.isShared && (
                                <span className="no-print ml-1 text-purple-600 font-sans text-xs">[YO]</span>
                              )}
                              {!exam.isShared && exam.createdBy.role === "ADMIN" && (
                                <span className="no-print ml-1 text-blue-500 font-sans text-xs">[YÖN]</span>
                              )}
                            </td>
                            <td className="border border-black px-2 py-1" style={{ borderColor: "black", borderTop: cellTopBorder, backgroundColor: cellBg }}>
                              {exam.course.name}{" "}
                              <span className="text-gray-500 text-xs">Şb.{exam.course.section}</span>
                            </td>
                            <td className="border border-black px-2 py-1" style={{ borderColor: "black", borderTop: cellTopBorder, backgroundColor: cellBg }}>
                              {exam.instructor.name}
                            </td>
                            <td className="border border-black px-2 py-1" style={{ borderColor: "black", borderTop: cellTopBorder, backgroundColor: cellBg }}>
                              {exam.roomIds.map((rid) => (
                                <div key={rid}>{roomMap[rid] ?? rid}</div>
                              ))}
                            </td>
                            <td className="border border-black px-2 py-1" style={{ borderColor: "black", borderTop: cellTopBorder, backgroundColor: cellBg }}>
                              {supervisors.map((sid, idx) => (
                                <div key={idx}>{sid}</div>
                              ))}
                              {(exam.isShared || (!exam.isShared && exam.createdBy.role === "ADMIN")) && supervisors.length === 0 && (
                                <span className="no-print text-amber-500 text-xs italic">Gözetmen atanmamış</span>
                              )}
                            </td>
                            {canEdit && (
                              <td className="no-print border border-black px-2 py-1 whitespace-nowrap" style={{ borderColor: "black", borderTop: cellTopBorder, backgroundColor: cellBg }}>
                                {actionCell}
                              </td>
                            )}
                          </tr>
                        );
                        if (i === 0) isFirstRowOfDay = false;
                      }
                    }
                  }
                };

                renderSessionRows(morningSessions);

                if (hasLunch) {
                  rows.push(
                    <tr key={`lunch-${day.date}`}>
                      <td
                        colSpan={colSpanTotal}
                        className="text-center py-1 font-medium text-gray-600 border border-black"
                        style={{ borderColor: "black", backgroundColor: lunchBg }}
                      >
                        ÖĞLE ARASI
                      </td>
                    </tr>
                  );
                }

                renderSessionRows(afternoonSessions);
                dayIndex++;
              }

              return rows;
            })()
          )}
        </tbody>
      </table>

      {/* Footer */}
      <div className="mt-4 text-xs text-right pr-4">
        <p className="font-medium">{program.name} Bölüm Başkanı</p>
      </div>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Sınavı sil"
        description="Bu sınavı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Evet, sil"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
