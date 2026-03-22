import axios from 'axios';

export async function deleteExam(id: string) {
  await axios.delete(`http://localhost:3001/api/schedule/exams/${id}`);
}

export async function updateSharedExamSupervisors(examId: string, programId: string, supervisorIds: string[]) {
  await axios.post(`http://localhost:3001/api/schedule/exams/${examId}/shared-supervisors`, { programId, supervisorIds });
}

export async function assignSupervisorsToAdminExam(examId: string, supervisorIds: string[]) {
  await axios.post(`http://localhost:3001/api/schedule/exams/${examId}/admin-supervisors`, { supervisorIds });
}

// Stubs for ExamModal actions
export async function createExam(data: any) {
  await axios.post(`http://localhost:3001/api/schedule/exams`, data);
}

export async function updateExam(id: string, data: any) {
  await axios.put(`http://localhost:3001/api/schedule/exams/${id}`, data);
}

export async function checkInstructorConflict(instructorId: string, date: string, time: string, excludeExamId?: string) {
  const params = new URLSearchParams({ instructorId, date, time });
  if (excludeExamId) params.append('excludeExamId', excludeExamId);
  const res = await axios.get(`http://localhost:3001/api/schedule/check-conflict?${params.toString()}`);
  return res.data.conflict ? res.data : null;
}
