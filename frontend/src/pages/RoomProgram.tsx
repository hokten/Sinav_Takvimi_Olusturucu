import { useEffect, useState } from "react";
import axios from "axios";
import { RoomProgramView } from "@/components/program/RoomProgramView";
import { useAuth } from "@/contexts/AuthContext";

export default function RoomProgramPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const { logout } = useAuth();
  
  useEffect(() => {
    Promise.all([
      axios.get("/schedule/data"),
      axios.get("/requests")
    ])
      .then(([scheduleRes, requestsRes]) => {
        const schedule = scheduleRes.data;
        const requests = requestsRes.data;
        
        const mySlotRequests = requests.filter((r: any) => 
          schedule.session.user.programIds?.includes(r.fromProgramId)
        );
        const activeSlotRequests = requests.filter((r: any) => 
          ["PENDING", "APPROVED"].includes(r.status)
        );
        
        setData({
          ...schedule,
          userRole: schedule.session.user.role,
          userProgramId: schedule.session.user.programIds?.[0] || null,
          userProgramIds: schedule.session.user.programIds || [],
          mySlotRequests,
          activeSlotRequests
        });
      })
      .catch((err) => {
        setError(err.message);
        if (err.response?.status === 401) logout();
      });
  }, [logout]);

  if (error) return <div className="p-8 text-red-500 font-medium bg-red-50 border border-red-200 rounded-md">Hata: {error}</div>;
  if (!data) return <div className="p-8 text-gray-500 animate-pulse">Salon Programı Yükleniyor...</div>;

  return <RoomProgramView {...data} />;
}
