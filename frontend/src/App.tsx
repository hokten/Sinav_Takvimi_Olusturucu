import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/Login";
import { useAuth } from "@/contexts/AuthContext";
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

import DashboardLayout from "@/layouts/DashboardLayout";

import SchedulePage from "@/pages/Schedule";
import UnderConstruction from "@/pages/UnderConstruction";
import DepartmentsPage from "@/pages/Departments";
import UsersPage from "@/pages/Users";
import RoomsPage from "@/pages/Rooms";
import InstructorsPage from "@/pages/Instructors";
import CoursesPage from "@/pages/Courses";
import RoomAssignmentsPage from "@/pages/RoomAssignments";
import SessionsPage from "@/pages/Sessions";
import RequestsPage from "@/pages/Requests";
import EmptyRoomsPage from "@/pages/EmptyRooms";
import RoomProgramPage from "@/pages/RoomProgram";
import InstructorProgramPage from "@/pages/InstructorProgram";
import InstructorStatisticsPage from "@/pages/InstructorStatistics";

function App() {
  const routes: string[] = [
  ];

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/schedule"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <SchedulePage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <DepartmentsPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={ <ProtectedRoute> <DashboardLayout> <UsersPage /> </DashboardLayout> </ProtectedRoute> }
      />
      <Route
        path="/rooms"
        element={ <ProtectedRoute> <DashboardLayout> <RoomsPage /> </DashboardLayout> </ProtectedRoute> }
      />
      <Route
        path="/instructors"
        element={ <ProtectedRoute> <DashboardLayout> <InstructorsPage /> </DashboardLayout> </ProtectedRoute> }
      />
      <Route
        path="/courses"
        element={ <ProtectedRoute> <DashboardLayout> <CoursesPage /> </DashboardLayout> </ProtectedRoute> }
      />
      <Route
        path="/room-assignments"
        element={ <ProtectedRoute> <DashboardLayout> <RoomAssignmentsPage /> </DashboardLayout> </ProtectedRoute> }
      />
      <Route
        path="/sessions"
        element={ <ProtectedRoute> <DashboardLayout> <SessionsPage /> </DashboardLayout> </ProtectedRoute> }
      />
      <Route
        path="/requests"
        element={ <ProtectedRoute> <DashboardLayout> <RequestsPage /> </DashboardLayout> </ProtectedRoute> }
      />
      <Route
        path="/empty-rooms"
        element={ <ProtectedRoute> <DashboardLayout> <EmptyRoomsPage /> </DashboardLayout> </ProtectedRoute> }
      />
      <Route
        path="/room-program"
        element={ <ProtectedRoute> <DashboardLayout> <RoomProgramPage /> </DashboardLayout> </ProtectedRoute> }
      />
      <Route
        path="/instructor-program"
        element={ <ProtectedRoute> <DashboardLayout> <InstructorProgramPage /> </DashboardLayout> </ProtectedRoute> }
      />
      <Route
        path="/instructor-statistics"
        element={ <ProtectedRoute> <DashboardLayout> <InstructorStatisticsPage /> </DashboardLayout> </ProtectedRoute> }
      />
      {routes.map(route => (
        <Route
          key={route}
          path={route}
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UnderConstruction />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      ))}
      <Route path="*" element={<Navigate to="/schedule" replace />} />
    </Routes>
  );
}

export default App;
