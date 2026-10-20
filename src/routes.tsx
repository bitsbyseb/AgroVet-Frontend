import { createBrowserRouter, Navigate } from "react-router";
import LogIn from "./pages/LogIn";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./layouts/MainLayout";
import AnimalsList from "./pages/Animals";
import CreateAnimal from "./pages/Animals/Create";
import EditAnimal from "./pages/Animals/Edit";
import TransferAnimal from "./pages/Animals/Transfer";
import AnimalHistory from "./pages/Animals/History";
import AnimalVaccines from "./pages/Animals/Vaccines";
import AnimalProduction from "./pages/Animals/Production";
import AnimalReproduction from "./pages/Animals/Reproduction";
import AnimalDiet from "./pages/Animals/Diet";
import OwnersList from "./pages/Owners";
import CreateOwner from "./pages/Owners/Create";
import EditOwner from "./pages/Owners/Edit";
import OwnerAnimals from "./pages/Owners/OwnerAnimals";
import FoodsList from "./pages/Foods";
import AppointmentsList from "./pages/Appointments";
import PaddockListView, { PaddockDetailView } from "./pages/Paddocks";
import GrazingListView, { GrazingHistoryView } from "./pages/Grazing";
import MyAnimalsView from "./pages/owner/MyAnimalsView";
import Reminders from "./pages/owner/Reminders";

import { authService } from "./services/api";

const isAuthenticated = () => !!localStorage.getItem("token");

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
};

const RoleProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) => {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  const user = authService.getCurrentUser();
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

/* eslint-disable react-refresh/only-export-components */
export const router = createBrowserRouter([
    {
        path: "/login",
        element: <LogIn />
    },
    {
        path: "/register",
        element: <Register />
    },
    {
        path: "/",
        element: (
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Dashboard /> },
            { path: "animals", element: <AnimalsList /> },
            { path: "animals/new", element: <CreateAnimal /> },
            { path: "animals/:id/edit", element: <EditAnimal /> },
            { path: "animals/:id/transfer", element: <TransferAnimal /> },
            { path: "animals/:id/history", element: <AnimalHistory /> },
            { path: "animals/:id/vaccines", element: <AnimalVaccines /> },
            { path: "animals/:id/production", element: <AnimalProduction /> },
            { path: "animals/:id/reproduction", element: <AnimalReproduction /> },
            { path: "animals/:id/diet", element: <AnimalDiet /> },
            { path: "paddocks", element: <PaddockListView /> },
            { path: "paddocks/:id", element: <PaddockDetailView /> },
            { path: "grazing", element: <GrazingListView /> },
            { path: "grazing/history", element: <GrazingHistoryView /> },
            { path: "foods", element: <FoodsList /> },
            { path: "appointments", element: <AppointmentsList /> },
            { 
              path: "owners", 
              element: (
                <RoleProtectedRoute allowedRoles={['administrator', 'veterinarian']}>
                  <OwnersList />
                </RoleProtectedRoute>
              ) 
            },
            { 
              path: "owners/new", 
              element: (
                <RoleProtectedRoute allowedRoles={['administrator']}>
                  <CreateOwner />
                </RoleProtectedRoute>
              ) 
            },
            { 
              path: "owners/:id/edit", 
              element: (
                <RoleProtectedRoute allowedRoles={['administrator']}>
                  <EditOwner />
                </RoleProtectedRoute>
              ) 
            },
            { 
              path: "owners/:id/animals", 
              element: (
                <RoleProtectedRoute allowedRoles={['administrator', 'veterinarian']}>
                  <OwnerAnimals />
                </RoleProtectedRoute>
              ) 
            },
            { path: "my-animals", element: <MyAnimalsView /> },
            { path: "owner/animals", element: <MyAnimalsView /> },
            { 
              path: "my-reminders", 
              element: (
                <RoleProtectedRoute allowedRoles={['owner', 'administrator', 'veterinarian']}>
                  <Reminders />
                </RoleProtectedRoute>
              ) 
            },
            { 
              path: "owner/reminders", 
              element: (
                <RoleProtectedRoute allowedRoles={['owner', 'administrator', 'veterinarian']}>
                  <Reminders />
                </RoleProtectedRoute>
              ) 
            },
        ],
    },
]);
