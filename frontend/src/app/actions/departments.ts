import axios from 'axios';

export async function createDepartment(data: { name: string }) {
  await axios.post('http://localhost:3001/api/departments', data);
}

export async function updateDepartment(id: string, data: { name: string }) {
  await axios.put(`http://localhost:3001/api/departments/${id}`, data);
}

export async function deleteDepartment(id: string) {
  await axios.delete(`http://localhost:3001/api/departments/${id}`);
}
