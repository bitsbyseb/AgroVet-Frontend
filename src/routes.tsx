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
import OwnersList from "./pages/Owners";
import CreateOwner from "./pages/Owners/Create";
import EditOwner from "./pages/Owners/Edit";
import OwnerAnimals from "./pages/Owners/OwnerAnimals";

const isAuthenticated = () => !!localStorage.getItem("token");

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  return isAuthenticated() ? <>{children}</> : <Navigate to="/login" replace />;
};

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
            { path: "owners", element: <OwnersList /> },
            { path: "owners/new", element: <CreateOwner /> },
            { path: "owners/:id/edit", element: <EditOwner /> },
            { path: "owners/:id/animals", element: <OwnerAnimals /> },
        ],
    },
]);
