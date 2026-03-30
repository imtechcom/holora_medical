import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import AdminLayout from "../components/layout/AdminLayout";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import AppointmentPage from "../pages/AppointmentPage";
import PatientProfilePage from "../pages/PatientProfilePage";

import DashboardPage from "../pages/admin/DashboardPage";
import PatientConsultationRequestPage from "../pages/PatientConsultationRequestPage";
import DoctorRequestsListPage from "../pages/DoctorRequestsListPage";
import DoctorConsultationDetailPage from "../pages/DoctorConsultationDetailPage";

import UsersPage from "../pages/admin/UsersPage";
import UserFormPage from "../pages/admin/UserFormPage";
import RolesPage from "../pages/admin/RolesPage";
import RoleFormPage from "../pages/admin/RoleFormPage";
import RoleDetailPage from "../pages/admin/RoleDetailPage";
import PermissionsPage from "../pages/admin/PermissionsPage";
import PermissionFormPage from "../pages/admin/PermissionFormPage";
import PatientsPage from "../pages/admin/PatientsPage";
import PatientFormPage from "../pages/admin/PatientFormPage";
import DoctorsPage from "../pages/admin/DoctorsPage";
import DoctorFormPage from "../pages/admin/DoctorFormPage";
import SpecialtiesPage from "../pages/admin/SpecialtiesPage";
import SpecialtyFormPage from "../pages/admin/SpecialtyFormPage";
import BranchesPage from "../pages/admin/BranchesPage";
import BranchFormPage from "../pages/admin/BranchFormPage";
import AppointmentsAdminPage from "../pages/admin/AppointmentsAdminPage";
import DoctorSchedulePage from "../pages/admin/DoctorSchedulePage";
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

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PatientProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/patient/consultations/new"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PatientConsultationRequestPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/consultations/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DoctorConsultationDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctor/consultations"
          element={
            <AdminRoute allowedRoles={["doctor", "admin", "super_admin"]}>
              <AdminLayout>
                <DoctorRequestsListPage />
              </AdminLayout>
            </AdminRoute>
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
          path="/admin/users/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <UserFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/users/:userId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <UserFormPage />
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
          path="/admin/roles/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <RoleFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/roles/:roleId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <RoleFormPage />
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
          path="/admin/permissions/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <PermissionFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/permissions/:permissionId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <PermissionFormPage />
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
          path="/admin/doctors/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <DoctorFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/doctors/:doctorId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <DoctorFormPage />
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
          path="/admin/patients/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <PatientFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/patients/:patientId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <PatientFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/specialties"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <SpecialtiesPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/specialties/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <SpecialtyFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/specialties/:specialtyId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <SpecialtyFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/branches"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <BranchesPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/branches/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <BranchFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/branches/:branchId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <BranchFormPage />
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
          path="/admin/schedules"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin", "doctor"]}>
              <AdminLayout>
                <DoctorSchedulePage />
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