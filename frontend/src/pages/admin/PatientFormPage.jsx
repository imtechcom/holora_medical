import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getPatientByIdApi,
  createPatientApi,
  updatePatientApi,
} from "../../services/patientService";
import branchService from "../../services/branchService";

const PatientFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { patientId } = useParams();
  const isEdit = !!patientId;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [branches, setBranches] = useState([]);

  const [formData, setFormData] = useState({
    user_id: "",
    patient_code: "",
    branch_ids: [],
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
    status: "active",
  });

  // Fetch patient data if editing
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const branchRes = await branchService.getAllBranches();
        setBranches(branchRes.data || []);
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };

    fetchBranches();

    if (isEdit) {
      const fetchPatient = async () => {
        try {
          const res = await getPatientByIdApi(patientId);
          const patient = res.data;
          if (patient) {
            setFormData({
              user_id: patient.user_id || "",
              patient_code: patient.patient_code || "",
              branch_ids: patient.branch_ids || [],
              full_name: patient.full_name || "",
              phone: patient.phone || "",
              email: patient.email || "",
              gender: patient.gender || "",
              date_of_birth: patient.date_of_birth
                ? patient.date_of_birth.split("T")[0]
                : "",
              address: patient.address || "",
              blood_group: patient.blood_group || "",
              allergies: patient.allergies || "",
              medical_history: patient.medical_history || "",
              emergency_contact_name: patient.emergency_contact_name || "",
              emergency_contact_phone: patient.emergency_contact_phone || "",
              status: patient.status || "active",
            });
          }
        } catch (err) {
          console.error("Error fetching patient:", err);
          setError(t("admin.errorLoadingPatient"));
        } finally {
          setLoading(false);
        }
      };
      fetchPatient();
    }
  }, [patientId, isEdit, t]);

  const validateForm = () => {
    if (!formData.full_name?.trim()) {
      setError(t("admin.fullNameRequired"));
      return false;
    }
    if (!formData.phone?.trim()) {
      setError(t("admin.phoneRequired"));
      return false;
    }
    if (!isEdit && !formData.patient_code?.trim()) {
      setError(t("admin.patientCodeRequired"));
      return false;
    }
    if (!formData.branch_ids.length) {
      setError(t("admin.branchRequired"));
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
      if (isEdit) {
        await updatePatientApi(patientId, formData);
        setSuccessMessage(t("admin.patientUpdatedSuccess"));
        setTimeout(() => navigate("/admin/patients"), 1500);
      } else {
        await createPatientApi(formData);
        setSuccessMessage(t("admin.patientCreatedSuccess"));
        setTimeout(() => navigate("/admin/patients"), 1500);
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
          {isEdit ? t("admin.editPatient") : t("admin.addNewPatient")}
        </h2>
        <p className="text-gray-600">
          {isEdit
            ? t("admin.updatePatientInfo")
            : t("admin.fillFormToAddPatient")}
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
                placeholder="John Doe"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.patientCode")} {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                name="patient_code"
                value={formData.patient_code}
                onChange={handleInputChange}
                disabled={isEdit}
                placeholder="PAT000001"
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition ${
                  isEdit ? "bg-gray-100 cursor-not-allowed" : ""
                }`}
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
                placeholder="patient@example.com"
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
                {t("admin.gender")}
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition bg-white"
              >
                <option value="">Select Gender</option>
                <option value="male">{t("admin.genderMale")}</option>
                <option value="female">{t("admin.genderFemale")}</option>
                <option value="other">{t("admin.genderOther")}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.dateOfBirth")}
              </label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.address")}
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="123 Main Street"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
              />
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
              <p className="text-xs text-gray-500 mt-1">{t("admin.selectPatientBranchesHelp")}</p>
            </div>
          </div>
        </div>

        {/* Section 2: Medical Information */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-[#E06666] text-white rounded-full flex items-center justify-center text-sm">
              2
            </span>
            {t("admin.medicalInformation")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.bloodGroup")}
              </label>
              <select
                name="blood_group"
                value={formData.blood_group}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition bg-white"
              >
                <option value="">Select Blood Group</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
              {t("admin.allergies")}
            </label>
            <textarea
              name="allergies"
              value={formData.allergies}
              onChange={handleInputChange}
              placeholder={t("admin.allergiesPlaceholder")}
              rows="3"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 mt-4">
              {t("admin.medicalHistory")}
            </label>
            <textarea
              name="medical_history"
              value={formData.medical_history}
              onChange={handleInputChange}
              placeholder={t("admin.medicalHistoryPlaceholder")}
              rows="3"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition resize-none"
            />
          </div>
        </div>

        {/* Section 3: Emergency Contact */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-[#E06666] text-white rounded-full flex items-center justify-center text-sm">
              3
            </span>
            {t("admin.emergencyContact")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.emergencyContactName")}
              </label>
              <input
                type="text"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleInputChange}
                placeholder="John Smith"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.emergencyContactPhone")}
              </label>
              <input
                type="tel"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleInputChange}
                placeholder="+84 812 345 6789"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t pt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/patients")}
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

export default PatientFormPage;
