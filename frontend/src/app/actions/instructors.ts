import axios from 'axios';
export async function createInstructor(data: any) { await axios.post('http://localhost:3001/api/instructors', data); }
export async function updateInstructor(id: string, data: any) { await axios.put(`http://localhost:3001/api/instructors/${id}`, data); }
export async function deleteInstructor(id: string) { await axios.delete(`http://localhost:3001/api/instructors/${id}`); }
