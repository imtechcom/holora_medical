import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import AdminLayout from "../components/layout/AdminLayout";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import AppointmentPage from "../pages/AppointmentPage";

import DashboardPage from "../pages/admin/DashboardPage";
import UsersPage from "../pages/admin/UsersPage";
import RolesPage from "../pages/admin/RolesPage";
import RoleDetailPage from "../pages/admin/RoleDetailPage";
import PermissionsPage from "../pages/admin/PermissionsPage";
import PatientsPage from "../pages/admin/PatientsPage";
import DoctorsPage from "../pages/admin/DoctorsPage";
import AppointmentsAdminPage from "../pages/admin/AppointmentsAdminPage";
import ConsultationsPage from "../pages/admin/ConsultationsPage";

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/"
          element={
            <MainLayout>
              <HomePage />
            </MainLayout>
          }
        />

        <Route
          path="/login"
          element={
            <MainLayout>
              <LoginPage />
            </MainLayout>
          }
        />

        <Route
          path="/register"
          element={
            <MainLayout>
              <RegisterPage />
            </MainLayout>
          }
        />

        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AppointmentPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin", "doctor"]}>
              <AdminLayout>
                <DashboardPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <UsersPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/roles"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <RolesPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/roles/:roleId"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <RoleDetailPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/permissions"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <PermissionsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/doctors"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <DoctorsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/patients"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin", "doctor"]}>
              <AdminLayout>
                <PatientsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/appointments"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin", "doctor"]}>
              <AdminLayout>
                <AppointmentsAdminPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/consultations"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin", "doctor"]}>
              <AdminLayout>
                <ConsultationsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;