import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import {
  getMyProfileApi,
  updateMyProfileApi,
} from "../services/patientService";

const PatientProfilePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: "",
    phone: "",
    email: "",
    gender: "",
    date_of_birth: "",
    address: "",
    blood_group: "",
    allergies: "",
    medical_history: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyProfileApi();
      if (res.data) {
        setProfileData({
          full_name: res.data.full_name || "",
          phone: res.data.phone || "",
          email: res.data.email || "",
          gender: res.data.gender || "",
          date_of_birth: res.data.date_of_birth || "",
          address: res.data.address || "",
          blood_group: res.data.blood_group || "",
          allergies: res.data.allergies || "",
          medical_history: res.data.medical_history || "",
          emergency_contact_name: res.data.emergency_contact_name || "",
          emergency_contact_phone: res.data.emergency_contact_phone || "",
        });
      }
      setError("");
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(
        err?.response?.data?.message || t("patient.errorLoadingProfile")
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (role !== "patient") {
      navigate("/");
      return;
    }

    fetchProfile();
  }, [isAuthenticated, role, navigate, fetchProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!profileData.full_name?.trim()) {
      setError(t("admin.fullNameRequired"));
      return false;
    }
    if (!profileData.phone?.trim()) {
      setError(t("admin.phoneRequired"));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      await updateMyProfileApi(profileData);
      setSuccessMessage(t("patient.profileUpdatedSuccess"));
      setIsEditing(false);
      // Refresh profile data
      await fetchProfile();
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message || t("patient.errorUpdatingProfile");
      setError(errorMsg);
      console.error("Error updating profile:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto rounded-2xl bg-white p-6 shadow-sm text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-[#E06666] border-r-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || role !== "patient") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          {/* Header */}
          <div className="border-b pb-6 mb-6">
            <h1 className="text-3xl font-bold text-[#E06666] mb-2">
              {t("patient.myProfile")}
            </h1>
            <p className="text-gray-600">
              {t("patient.profileDescription")}
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-3">
              <span className="text-xl flex-shrink-0">✅</span>
              <div>
                <p className="font-semibold">{t("common.success")}</p>
                <p className="text-sm">{successMessage}</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="font-semibold">{t("common.error")}</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit}>
            {/* Section 1: Personal Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#E06666] text-white rounded-full flex items-center justify-center text-sm">
                  1
                </span>
                {t("patient.personalInformation")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("admin.fullName")}
                    <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="full_name"
                      value={profileData.full_name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
                    />
                  ) : (
                    <p className="px-4 py-2.5 text-gray-700">
                      {profileData.full_name || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("admin.phone")}
                    <span className="text-red-500">*</span>
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      placeholder="+84 812 345 6789"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
                    />
                  ) : (
                    <p className="px-4 py-2.5 text-gray-700">
                      {profileData.phone || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("admin.email")}
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      placeholder="patient@example.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
                    />
                  ) : (
                    <p className="px-4 py-2.5 text-gray-700">
                      {profileData.email || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("patient.gender")}
                  </label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={profileData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition bg-white"
                    >
                      <option value="">{t("common.selectOne")}</option>
                      <option value="male">{t("admin.genderMale")}</option>
                      <option value="female">{t("admin.genderFemale")}</option>
                      <option value="other">{t("admin.genderOther")}</option>
                    </select>
                  ) : (
                    <p className="px-4 py-2.5 text-gray-700">
                      {profileData.gender
                        ? t(`admin.gender${profileData.gender.charAt(0).toUpperCase() + profileData.gender.slice(1)}`)
                        : "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("patient.dateOfBirth")}
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="date_of_birth"
                      value={profileData.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
                    />
                  ) : (
                    <p className="px-4 py-2.5 text-gray-700">
                      {profileData.date_of_birth || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("admin.bloodGroup")}
                  </label>
                  {isEditing ? (
                    <select
                      name="blood_group"
                      value={profileData.blood_group}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition bg-white"
                    >
                      <option value="">{t("common.selectOne")}</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  ) : (
                    <p className="px-4 py-2.5 text-gray-700">
                      {profileData.blood_group || "-"}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("patient.address")}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={profileData.address}
                      onChange={handleInputChange}
                      placeholder="123 Main Street, City, Country"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
                    />
                  ) : (
                    <p className="px-4 py-2.5 text-gray-700">
                      {profileData.address || "-"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Medical Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#E06666] text-white rounded-full flex items-center justify-center text-sm">
                  2
                </span>
                {t("patient.medicalInformation")}
              </h3>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("admin.allergies")}
                  </label>
                  {isEditing ? (
                    <textarea
                      name="allergies"
                      value={profileData.allergies}
                      onChange={handleInputChange}
                      placeholder={t("admin.allergiesPlaceholder")}
                      rows="3"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition resize-none"
                    />
                  ) : (
                    <p className="px-4 py-2.5 text-gray-700 whitespace-pre-wrap">
                      {profileData.allergies || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("admin.medicalHistory")}
                  </label>
                  {isEditing ? (
                    <textarea
                      name="medical_history"
                      value={profileData.medical_history}
                      onChange={handleInputChange}
                      placeholder={t("admin.medicalHistoryPlaceholder")}
                      rows="4"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition resize-none"
                    />
                  ) : (
                    <p className="px-4 py-2.5 text-gray-700 whitespace-pre-wrap">
                      {profileData.medical_history || "-"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Emergency Contact */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-[#E06666] text-white rounded-full flex items-center justify-center text-sm">
                  3
                </span>
                {t("patient.emergencyContact")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("patient.emergencyContactName")}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={profileData.emergency_contact_name}
                      onChange={handleInputChange}
                      placeholder="Contact Person Name"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
                    />
                  ) : (
                    <p className="px-4 py-2.5 text-gray-700">
                      {profileData.emergency_contact_name || "-"}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("patient.emergencyContactPhone")}
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={profileData.emergency_contact_phone}
                      onChange={handleInputChange}
                      placeholder="+84 812 345 6789"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
                    />
                  ) : (
                    <p className="px-4 py-2.5 text-gray-700">
                      {profileData.emergency_contact_phone || "-"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-6 flex justify-end gap-4">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setError("");
                      fetchProfile();
                    }}
                    disabled={submitting}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-[#E06666] text-white rounded-lg hover:bg-[#d05555] transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {submitting ? t("common.saving") : t("common.save")}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 bg-[#E06666] text-white rounded-lg hover:bg-[#d05555] transition font-medium"
                >
                  {t("common.edit")}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientProfilePage;
