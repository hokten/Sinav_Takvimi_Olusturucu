import axios from 'axios';
export async function createScheduleDay(data: any) { await axios.post('http://localhost:3001/api/sessions', data); }
export async function updateScheduleDay(id: string, sessions: string[]) { await axios.put(`http://localhost:3001/api/sessions/${id}`, sessions); }
export async function deleteScheduleDay(id: string) { await axios.delete(`http://localhost:3001/api/sessions/${id}`); }
