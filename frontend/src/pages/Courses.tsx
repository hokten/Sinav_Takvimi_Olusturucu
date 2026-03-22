import { useEffect, useState } from "react";
import axios from "axios";
import { CoursesManager } from "@/components/courses/CoursesManager";
import { useAuth } from "@/contexts/AuthContext";

export default function CoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { logout } = useAuth();

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get("/courses"),
      axios.get("/programs"),
      axios.get("/instructors")
    ])
      .then(([crsRes, progRes, instRes]) => {
        setCourses(crsRes.data);
        setPrograms(progRes.data);
        setInstructors(instRes.data);
        setError("");
      })
      .catch((err) => {
        setError(err.message);
        if (err.response?.status === 401) logout();
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [logout]);

  if (error) return <div className="p-8 text-red-500 font-medium bg-red-50 border border-red-200 rounded-md">Error: {error}</div>;
  if (loading && courses.length === 0) return <div className="p-8 text-gray-500 animate-pulse">Dersler Yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ders Yönetimi</h1>
        <p className="text-sm text-gray-500 mt-1">Sınavları yapılacak dersleri ayarlayın, kota ve şubeleri belirleyin.</p>
      </div>
      <CoursesManager 
        courses={courses} 
        programs={programs} 
        instructors={instructors}
        onRefresh={fetchData} 
      />
    </div>
  );
}
