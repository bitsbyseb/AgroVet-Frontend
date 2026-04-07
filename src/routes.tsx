import { createBrowserRouter, Navigate } from "react-router";
import LogIn from "./pages/LogIn";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MainLayout from "./layouts/MainLayout";
import AnimalsList from "./pages/Animals";
import CreateAnimal from "./pages/Animals/Create";
import OwnersList from "./pages/Owners";
import CreateOwner from "./pages/Owners/Create";

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
            { path: "owners", element: <OwnersList /> },
            { path: "owners/new", element: <CreateOwner /> },
        ],
    },
]);
