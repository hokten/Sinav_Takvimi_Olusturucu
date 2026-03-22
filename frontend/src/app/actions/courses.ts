import axios from 'axios';
export async function createCourse(data: any) { await axios.post('http://localhost:3001/api/courses', data); }
export async function updateCourse(id: string, data: any) { await axios.put(`http://localhost:3001/api/courses/${id}`, data); }
export async function deleteCourse(id: string) { await axios.delete(`http://localhost:3001/api/courses/${id}`); }

export interface ImportCourseRow {
  code: string;
  name: string;
  section: number;
  grade: number;
  quota: number;
  parentDeptName: string;
  departmentName: string;
  instructorName: string;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: string[];
}

export async function importCourses(rows: ImportCourseRow[]): Promise<ImportResult> {
  const res = await axios.post('http://localhost:3001/api/courses/import', { rows });
  return res.data;
}
