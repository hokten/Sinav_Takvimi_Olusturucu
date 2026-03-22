import axios from 'axios';
export async function createUser(data: any) { await axios.post('http://localhost:3001/api/users', data); }
export async function updateUser(id: string, data: any) { await axios.put(`http://localhost:3001/api/users/${id}`, data); }
export async function deleteUser(id: string) { await axios.delete(`http://localhost:3001/api/users/${id}`); }
