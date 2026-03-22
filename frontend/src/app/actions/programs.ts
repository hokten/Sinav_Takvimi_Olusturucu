import axios from 'axios';

export async function createProgram(data: { name: string; color: string; departmentId: string; isSharedSource: boolean }) {
  await axios.post('http://localhost:3001/api/programs', data);
}

export async function updateProgram(id: string, data: { name: string; color: string; departmentId: string; isSharedSource: boolean }) {
  await axios.put(`http://localhost:3001/api/programs/${id}`, data);
}

export async function deleteProgram(id: string) {
  await axios.delete(`http://localhost:3001/api/programs/${id}`);
}
