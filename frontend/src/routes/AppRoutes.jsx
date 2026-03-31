import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../components/layout/MainLayout";
import AdminLayout from "../components/layout/AdminLayout";
import ClinicOwnerLayout from "../components/layout/ClinicOwnerLayout";

import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import PricingPage from "../pages/PricingPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import AppointmentPage from "../pages/AppointmentPage";
import DoctorsPage from "../pages/DoctorsPage";
import PatientConsultationHistoryPage from "../pages/PatientConsultationHistoryPage";
import VideoConsultationPage from "../pages/VideoConsultationPage";
import PatientProfilePage from "../pages/PatientProfilePage";
import PatientBranchesPage from "../pages/PatientBranchesPage";
import PatientBranchDetailPage from "../pages/PatientBranchDetailPage";
import DoctorPublicDetailPage from "../pages/DoctorPublicDetailPage";
import HoloraMindPage from "../pages/HoloraMindPage";
import DoctorInviteSetupPage from "../pages/DoctorInviteSetupPage";

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
import AdminDoctorsPage from "../pages/admin/DoctorsPage";
import DoctorFormPage from "../pages/admin/DoctorFormPage";
import SpecialtiesPage from "../pages/admin/SpecialtiesPage";
import SpecialtyFormPage from "../pages/admin/SpecialtyFormPage";
import BranchesPage from "../pages/admin/BranchesPage";
import BranchFormPage from "../pages/admin/BranchFormPage";
import AppointmentsAdminPage from "../pages/admin/AppointmentsAdminPage";
import DoctorAppointmentsPage from "../pages/DoctorAppointmentsPage";
import DoctorSchedulePage from "../pages/admin/DoctorSchedulePage";
import ConsultationsPage from "../pages/admin/ConsultationsPage";

import ClinicOwnerDashboardPage from "../pages/clinic-owner/ClinicOwnerDashboardPage";
import MyBranchesPage from "../pages/clinic-owner/MyBranchesPage";
import MyDoctorsPage from "../pages/clinic-owner/MyDoctorsPage";
import SubscriptionPage from "../pages/clinic-owner/SubscriptionPage";

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import ClinicOwnerRoute from "./ClinicOwnerRoute";

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
          path="/pricing"
          element={
            <MainLayout>
              <PricingPage />
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
          path="/forgot-password"
          element={
            <MainLayout>
              <ForgotPasswordPage />
            </MainLayout>
          }
        />

        <Route
          path="/reset-password"
          element={
            <MainLayout>
              <ResetPasswordPage />
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
          path="/register/provider"
          element={
            <MainLayout>
              <RegisterPage defaultAccountType="provider" />
            </MainLayout>
          }
        />

        <Route
          path="/doctor/invite-setup"
          element={
            <MainLayout>
              <DoctorInviteSetupPage />
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
          path="/doctors"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DoctorsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/doctors/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <DoctorPublicDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/branches"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PatientBranchesPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/branches/:id"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PatientBranchDetailPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/appointments/:id/room"
          element={
            <ProtectedRoute>
              <VideoConsultationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/consultations/history"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PatientConsultationHistoryPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/holoramind"
          element={
            <ProtectedRoute>
              <HoloraMindPage />
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
            <AdminRoute allowedRoles={["super_admin", "admin", "doctor"]}>
              <AdminLayout>
                <DoctorsPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/doctors/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin", "doctor"]}>
              <AdminLayout>
                <DoctorFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/doctors/:doctorId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin", "doctor"]}>
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
            <AdminRoute allowedRoles={["super_admin", "admin", "doctor"]}>
              <AdminLayout>
                <BranchesPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/branches/new"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin", "doctor"]}>
              <AdminLayout>
                <BranchFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/branches/:branchId/edit"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin", "doctor"]}>
              <AdminLayout>
                <BranchFormPage />
              </AdminLayout>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/appointments"
          element={
            <AdminRoute allowedRoles={["super_admin", "admin"]}>
              <AdminLayout>
                <AppointmentsAdminPage />

                      <Route
                        path="/doctor/appointments"
                        element={
                          <AdminRoute allowedRoles={["doctor"]}>
                            <AdminLayout>
                              <DoctorAppointmentsPage />
                            </AdminLayout>
                          </AdminRoute>
                        }
                      />
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

        {/* ── Clinic Owner Portal ── */}
        <Route
          path="/clinic-owner"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <ClinicOwnerDashboardPage />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/branches"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <MyBranchesPage />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/branches/new"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <BranchFormPage returnPath="/clinic-owner/branches" />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/branches/:branchId/edit"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <BranchFormPage returnPath="/clinic-owner/branches" />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/doctors"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <MyDoctorsPage />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/subscription"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <SubscriptionPage />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/doctors/new"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <DoctorFormPage
                  returnPath="/clinic-owner/doctors"
                  fetchBranchesUrl="/branches/my"
                />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />

        <Route
          path="/clinic-owner/doctors/:doctorId/edit"
          element={
            <ClinicOwnerRoute>
              <ClinicOwnerLayout>
                <DoctorFormPage
                  returnPath="/clinic-owner/doctors"
                  fetchBranchesUrl="/branches/my"
                />
              </ClinicOwnerLayout>
            </ClinicOwnerRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;