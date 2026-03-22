import axios from 'axios';

export async function createSlotRequest(data: { programId: string; roomId: string; date: string; time: string }) {
  const res = await axios.post('http://localhost:3001/api/requests', data);
  return res.data;
}

export async function approveSlotRequest(requestId: string) {
  const res = await axios.post(`http://localhost:3001/api/requests/${requestId}/approve`);
  return res.data;
}

export async function rejectSlotRequest(requestId: string) {
  const res = await axios.post(`http://localhost:3001/api/requests/${requestId}/reject`);
  return res.data;
}

export async function withdrawSlotRequest(requestId: string) {
  const res = await axios.post(`http://localhost:3001/api/requests/${requestId}/withdraw`);
  return res.data;
}
