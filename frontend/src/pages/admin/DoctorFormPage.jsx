import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getDoctorByIdApi,
  createDoctorApi,
  updateDoctorApi,
} from "../../services/doctorService";
import specialtyService from "../../services/specialtyService";
import branchService from "../../services/branchService";
import subscriptionService from "../../services/subscriptionService";

const DoctorFormPage = ({ returnPath = "/admin/doctors", fetchBranchesUrl = null }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const isEdit = !!doctorId;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [inviteSetupUrl, setInviteSetupUrl] = useState("");
  const [specialties, setSpecialties] = useState([]);
  const [branches, setBranches] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);

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
    account_mode: "manual",
    // New fields for user creation (create mode only)
    username: "",
    password: "",
  });

  // Fetch doctor data if editing
  const fetchSpecialties = useCallback(async () => {
    try {
      const res = await specialtyService.getAllSpecialties();
      const allSpecialties = res.data || [];
      const leafSpecialties = allSpecialties.filter(
        (item) => Number(item.child_count || 0) === 0
      );
      setSpecialties(leafSpecialties);
    } catch (err) {
      console.error("Error fetching specialties:", err);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    try {
      const res = fetchBranchesUrl
        ? await branchService.getMyBranches()
        : await branchService.getAllBranches();
      setBranches(res.data || []);
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  }, [fetchBranchesUrl]);

  const fetchSubscriptionContext = useCallback(async () => {
    if (!fetchBranchesUrl) {
      setSubscriptions([]);
      setPlans([]);
      return;
    }

    try {
      const [subscriptionRes, planRes] = await Promise.all([
        subscriptionService.getMySubscriptions(),
        subscriptionService.getPlans(),
      ]);

      setSubscriptions(subscriptionRes.data || []);
      setPlans(planRes.data || []);
    } catch (err) {
      console.error("Error fetching subscription context:", err);
    }
  }, [fetchBranchesUrl]);

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
        account_mode: "manual",
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
    fetchSubscriptionContext();
    if (isEdit) {
      fetchDoctor();
    }
  }, [fetchSpecialties, fetchBranches, fetchSubscriptionContext, fetchDoctor, isEdit]);

  const selectedBranches = branches.filter((branch) =>
    formData.branch_ids.includes(branch.id)
  );

  const primarySelectedBranch = selectedBranches[0] || null;

  const selectedBranchSubscription = primarySelectedBranch
    ? subscriptions.find(
        (subscription) =>
          subscription.scope_type === "branch" &&
          Number(subscription.scope_id) === Number(primarySelectedBranch.id)
      ) || null
    : null;

  const selectedBranchPlan = selectedBranchSubscription
    ? plans.find((plan) => plan.code === selectedBranchSubscription.plan_code) || null
    : null;

  const doctorManageEntitlement = selectedBranchPlan?.entitlements?.find(
    (entitlement) => entitlement.feature_code === "doctor.manage"
  ) || null;

  const selectedBranchDoctorCount = Number(primarySelectedBranch?.doctor_count || 0);
  const selectedBranchDoctorLimit = Number(doctorManageEntitlement?.limit_value || 0);
  const hasFiniteDoctorLimit = Number.isInteger(selectedBranchDoctorLimit) && selectedBranchDoctorLimit > 0;
  const selectedBranchHasSubscription = !fetchBranchesUrl || !!selectedBranchSubscription;
  const selectedBranchSubscriptionActive =
    !fetchBranchesUrl ||
    !selectedBranchSubscription ||
    ["trialing", "active"].includes(selectedBranchSubscription.status);
  const selectedBranchDoctorLimitReached =
    fetchBranchesUrl &&
    !isEdit &&
    hasFiniteDoctorLimit &&
    selectedBranchDoctorCount >= selectedBranchDoctorLimit;

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
    if (fetchBranchesUrl && !selectedBranchHasSubscription) {
      setError("Selected branch does not have an active subscription yet. Create the branch again or activate a plan first.");
      return false;
    }
    if (fetchBranchesUrl && !selectedBranchSubscriptionActive) {
      setError("Selected branch subscription is inactive. Please activate or renew the branch plan first.");
      return false;
    }
    if (selectedBranchDoctorLimitReached) {
      setError("Selected branch has reached its doctor limit for the current subscription.");
      return false;
    }
    if (!isEdit) {
      if (formData.account_mode === "invite") {
        if (!formData.email?.trim()) {
          setError("Doctor email is required for invite mode");
          return false;
        }
      } else {
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
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setInviteSetupUrl("");

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      if (isEdit) {
        // Update existing doctor
        await updateDoctorApi(doctorId, formData);
        setSuccessMessage(t("admin.doctorUpdatedSuccess"));
        setTimeout(() => navigate(returnPath), 1500);
      } else {
        const doctorData = {
          ...formData,
          invite_redirect_base: `${window.location.origin}/doctor/invite-setup`,
        };

        if (doctorData.account_mode === "invite") {
          delete doctorData.username;
          delete doctorData.password;
        }

        const createRes = await createDoctorApi(doctorData);
        const setupUrl = createRes?.data?.invite_setup_url || "";

        if (setupUrl) {
          setInviteSetupUrl(setupUrl);
          setSuccessMessage("Doctor invited successfully. Share this setup link with the doctor.");
        } else {
          setSuccessMessage(t("admin.doctorCreatedSuccess"));
          setTimeout(() => navigate(returnPath), 1500);
        }
      }
    } catch (err) {
      let errorMsg = err?.response?.data?.message || t("admin.errorSubmittingForm");

      if (err?.response?.status === 402) {
        if (err?.response?.data?.message === "Active subscription required") {
          errorMsg = "Selected branch does not have an active doctor subscription. Open Subscription to activate a plan or create a new branch trial.";
        }

        if ((err?.response?.data?.message || "").includes("Doctor limit reached")) {
          errorMsg = "Selected branch has reached the doctor limit for its current plan. Upgrade the branch subscription or choose another branch.";
        }
      }

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
            {inviteSetupUrl && (
              <div className="mt-3 rounded-md border border-green-300 bg-white px-3 py-2 text-xs break-all text-gray-700">
                {inviteSetupUrl}
              </div>
            )}
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
                    {spec.parent_name ? `${spec.parent_name} > ${spec.name}` : spec.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              {!isEdit && (
                <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Account setup mode</p>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="account_mode"
                        value="manual"
                        checked={formData.account_mode === "manual"}
                        onChange={handleInputChange}
                        className="text-[#E06666] focus:ring-[#E06666]"
                      />
                      Create login now
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="account_mode"
                        value="invite"
                        checked={formData.account_mode === "invite"}
                        onChange={handleInputChange}
                        className="text-[#E06666] focus:ring-[#E06666]"
                      />
                      Invite by email
                    </label>
                  </div>
                </div>
              )}

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
              {fetchBranchesUrl && primarySelectedBranch && (
                <div className="mt-3 space-y-2">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    <p className="font-semibold text-gray-800">Primary branch for subscription check</p>
                    <p className="mt-1">
                      {primarySelectedBranch.name}
                      {selectedBranchSubscription
                        ? ` • ${selectedBranchSubscription.plan_name} (${selectedBranchSubscription.status})`
                        : " • No active subscription found"}
                    </p>
                    {hasFiniteDoctorLimit ? (
                      <p className="mt-1 text-xs text-gray-500">
                        Doctors used: {selectedBranchDoctorCount}/{selectedBranchDoctorLimit}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">Doctor limit: Unlimited</p>
                    )}
                  </div>

                  {!selectedBranchHasSubscription && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      This branch has no active subscription record yet. Go to Subscription and activate a branch plan if needed.
                    </div>
                  )}

                  {selectedBranchHasSubscription && !selectedBranchSubscriptionActive && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      The selected branch subscription is not active. You need an active or trialing plan before creating a doctor.
                    </div>
                  )}

                  {selectedBranchDoctorLimitReached && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      This branch has reached the doctor limit of its current plan. Upgrade the subscription or select another branch.
                    </div>
                  )}

                  {!selectedBranchDoctorLimitReached && hasFiniteDoctorLimit && selectedBranchDoctorCount === selectedBranchDoctorLimit - 1 && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                      This branch has only 1 doctor slot left on the current plan.
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isEdit && formData.account_mode === "manual" && (
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

            {!isEdit && formData.account_mode === "invite" && (
              <div className="md:col-span-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                A one-time setup link will be generated and shown after saving this doctor.
              </div>
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
