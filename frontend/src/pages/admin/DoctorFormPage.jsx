import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getDoctorByIdApi,
  createDoctorApi,
  updateDoctorApi,
} from "../../services/doctorService";
import { createUserApi } from "../../services/userService";
import specialtyService from "../../services/specialtyService";
import branchService from "../../services/branchService";

const DoctorFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const isEdit = !!doctorId;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [branches, setBranches] = useState([]);

  const [formData, setFormData] = useState({
    user_id: "",
    specialty_id: "",
    branch_ids: [],
    full_name: "",
    phone: "",
    email: "",
    license_number: "",
    qualification: "",
    experience_years: "",
    consultation_fee: "",
    bio: "",
    avatar_url: "",
    status: "active",
    // New fields for user creation (create mode only)
    username: "",
    password: "",
  });

  // Fetch doctor data if editing
  const fetchSpecialties = useCallback(async () => {
    try {
      const res = await specialtyService.getAllSpecialties();
      setSpecialties(res.data || []);
    } catch (err) {
      console.error("Error fetching specialties:", err);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const res = await branchService.getAllBranches();
      setBranches(res.data || []);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  }, []);

  const fetchDoctor = useCallback(async () => {
    try {
      const res = await getDoctorByIdApi(doctorId);
      const doctor = res.data;
      setFormData({
        user_id: doctor.user_id || "",
        specialty_id: doctor.specialty_id || "",
        branch_ids: doctor.branch_ids || [],
        full_name: doctor.full_name || "",
        phone: doctor.phone || "",
        email: doctor.email || "",
        license_number: doctor.license_number || "",
        qualification: doctor.qualification || "",
        experience_years: doctor.experience_years || "",
        consultation_fee: doctor.consultation_fee || "",
        bio: doctor.bio || "",
        avatar_url: doctor.avatar_url || "",
        status: doctor.status || "active",
        username: "",
        password: "",
      });
    } catch (err) {
      console.error("Error fetching doctor:", err);
      setError(t("admin.errorLoadingDoctor"));
    } finally {
      setLoading(false);
    }
  }, [doctorId, t]);

  useEffect(() => {
    fetchSpecialties();
    fetchBranches();
    if (isEdit) {
      fetchDoctor();
    }
  }, [fetchSpecialties, fetchBranches, fetchDoctor, isEdit]);

  const validateForm = () => {
    if (!formData.full_name?.trim()) {
      setError(t("admin.fullNameRequired"));
      return false;
    }
    if (!formData.phone?.trim()) {
      setError(t("admin.phoneRequired"));
      return false;
    }
    if (!formData.license_number?.trim()) {
      setError(t("admin.licenseNumberRequired"));
      return false;
    }
    if (!formData.specialty_id) {
      setError(t("admin.specialtyRequired"));
      return false;
    }
    if (!formData.branch_ids.length) {
      setError(t("admin.branchRequired"));
      return false;
    }
    if (!isEdit) {
      if (!formData.username?.trim()) {
        setError(t("admin.usernameRequired"));
        return false;
      }
      if (!formData.password?.trim()) {
        setError(t("admin.passwordRequired"));
        return false;
      }
      if (formData.password.length < 6) {
        setError(t("admin.passwordMinLength"));
        return false;
      }
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
      if (isEdit) {
        // Update existing doctor
        await updateDoctorApi(doctorId, formData);
        setSuccessMessage(t("admin.doctorUpdatedSuccess"));
        setTimeout(() => navigate("/admin/doctors"), 1500);
      } else {
        // Create new doctor with auto user creation
        const doctorData = { ...formData };
        let userId = null;

        try {
          // Step 1: Create user account with doctor role
          const userPayload = {
            username: formData.username,
            password: formData.password,
            email: formData.email || formData.username + "@hospital.local",
            full_name: formData.full_name,
            role_code: "doctor",
          };
          const userRes = await createUserApi(userPayload);
          userId = userRes.data.id || userRes.data.user_id;

          // Step 2: Link user to doctor record
          doctorData.user_id = userId;
          delete doctorData.username;
          delete doctorData.password;

          // Step 3: Create doctor record
          await createDoctorApi(doctorData);
          setSuccessMessage(t("admin.doctorCreatedSuccess"));
          setTimeout(() => navigate("/admin/doctors"), 1500);
        } catch (userErr) {
          const errorMsg =
            userErr?.response?.data?.message ||
            t("admin.errorCreatingUserAccount");
          setError(errorMsg);
          console.error("Error creating user account:", userErr);
          setSubmitting(false);
          return;
        }
      }
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message || t("admin.errorSubmittingForm");
      setError(errorMsg);
      console.error("Error submitting form:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBranchToggle = (branchId) => {
    const numericBranchId = Number(branchId);
    setFormData((prev) => {
      const exists = prev.branch_ids.includes(numericBranchId);
      return {
        ...prev,
        branch_ids: exists
          ? prev.branch_ids.filter((id) => id !== numericBranchId)
          : [...prev.branch_ids, numericBranchId],
      };
    });
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-[#E06666] border-r-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm">
      {/* Header */}
      <div className="border-b pb-6 mb-6">
        <h2 className="text-3xl font-bold text-[#E06666] mb-2">
          {isEdit ? t("admin.editDoctor") : t("admin.addNewDoctor")}
        </h2>
        <p className="text-gray-600">
          {isEdit
            ? t("admin.updateDoctorInfo")
            : t("admin.fillFormToAddDoctor")}
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

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Section 1: Basic Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-[#E06666] text-white rounded-full flex items-center justify-center text-sm">
              1
            </span>
            {t("admin.basicInformation")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.fullName")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Dr. John Doe"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.email")}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="doctor@hospital.com"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.phone")} <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+84 812 345 6789"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.license_number")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="license_number"
                value={formData.license_number}
                onChange={handleInputChange}
                placeholder="LIC-2024-001234"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("admin.licenseNumberHelp")}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.specialty")} <span className="text-red-500">*</span>
              </label>
              <select
                name="specialty_id"
                value={formData.specialty_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition bg-white"
              >
                <option value="">{t("admin.selectSpecialty")}</option>
                {specialties.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    {spec.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.branches")} <span className="text-red-500">*</span>
              </label>
              {branches.length === 0 ? (
                <p className="text-sm text-gray-500">{t("admin.noBranchesAvailable")}</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 border border-gray-300 rounded-lg">
                  {branches.map((branch) => {
                    const checked = formData.branch_ids.includes(branch.id);
                    return (
                      <label key={branch.id} className="flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleBranchToggle(branch.id)}
                          className="w-4 h-4 text-[#E06666] border-gray-300 rounded focus:ring-[#E06666]"
                        />
                        <span>
                          {branch.name}
                          {branch.code ? ` (${branch.code})` : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">{t("admin.selectBranchesHelp")}</p>
            </div>

            {!isEdit && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("admin.username")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="doctor_username"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t("admin.usernameHelp")}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("admin.password")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t("admin.passwordHelp")}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Section 2: Professional Details */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-[#E06666] text-white rounded-full flex items-center justify-center text-sm">
              2
            </span>
            {t("admin.professionalDetails")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.qualifications")}
              </label>
              <input
                type="text"
                name="qualification"
                value={formData.qualification}
                onChange={handleInputChange}
                placeholder="MD, Bachelor of Medicine"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.experience_years")}
              </label>
              <input
                type="number"
                name="experience_years"
                value={formData.experience_years}
                onChange={handleInputChange}
                placeholder="5"
                min="0"
                max="70"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.consultationFee")} ($)
              </label>
              <input
                type="number"
                name="consultation_fee"
                step="0.01"
                value={formData.consultation_fee}
                onChange={handleInputChange}
                placeholder="50.00"
                min="0"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.status")}
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition bg-white"
              >
                <option value="active">{t("admin.statusActive")}</option>
                <option value="inactive">{t("admin.statusInactive")}</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Additional Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-[#E06666] text-white rounded-full flex items-center justify-center text-sm">
              3
            </span>
            {t("admin.additionalInformation")}
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.bio")}
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder={t("admin.bioPlaceholder")}
                rows="4"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.avatarUrl")}
              </label>
              <input
                type="url"
                name="avatar_url"
                value={formData.avatar_url}
                onChange={handleInputChange}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t pt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/doctors")}
            disabled={submitting}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-[#E06666] text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-r-transparent rounded-full animate-spin"></div>
                {t("common.saving")}
              </>
            ) : (
              <>
                ✓ {isEdit ? t("common.update") : t("common.save")}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DoctorFormPage;
