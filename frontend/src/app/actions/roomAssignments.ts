import axios from 'axios';
export async function toggleRoomAssignment(roomId: string, programId: string) {
  await axios.post('http://localhost:3001/api/room-assignments/toggle', { roomId, programId });
}
