import axios from 'axios';
export async function createRoom(data: any) { await axios.post('http://localhost:3001/api/rooms', data); }
export async function updateRoom(id: string, data: any) { await axios.put(`http://localhost:3001/api/rooms/${id}`, data); }
export async function deleteRoom(id: string) { await axios.delete(`http://localhost:3001/api/rooms/${id}`); }
