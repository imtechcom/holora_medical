import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getAllPermissionsApi, createPermissionApi, updatePermissionApi } from "../../services/permissionService";

const PermissionFormPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { permissionId } = useParams();
  const isEdit = !!permissionId;

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    module_name: "",
    description: "",
    status: "active",
  });

  // Fetch permission data if editing
  useEffect(() => {
    if (isEdit) {
      const fetchPermission = async () => {
        try {
          const res = await getAllPermissionsApi();
          const permission = res.data.find((p) => p.id === parseInt(permissionId));
          if (permission) {
            setFormData({
              name: permission.name || "",
              code: permission.code || "",
              module_name: permission.module_name || "",
              description: permission.description || "",
              status: permission.status || "active",
            });
          }
        } catch (err) {
          console.error("Error fetching permission:", err);
          setError(t("admin.errorLoadingPermission"));
        } finally {
          setLoading(false);
        }
      };
      fetchPermission();
    }
  }, [permissionId, isEdit, t]);

  const validateForm = () => {
    if (!formData.name?.trim()) {
      setError(t("admin.nameRequired"));
      return false;
    }
    if (!formData.code?.trim()) {
      setError(t("admin.codeRequired"));
      return false;
    }
    if (!formData.module_name?.trim()) {
      setError(t("admin.moduleNameRequired"));
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
      const submitData = {
        name: formData.name,
        code: formData.code,
        module_name: formData.module_name,
        description: formData.description,
        status: formData.status,
      };

      if (isEdit) {
        await updatePermissionApi(permissionId, submitData);
        setSuccessMessage(t("admin.permissionUpdatedSuccess"));
        setTimeout(() => navigate("/admin/permissions"), 1500);
      } else {
        await createPermissionApi(submitData);
        setSuccessMessage(t("admin.permissionCreatedSuccess"));
        setTimeout(() => navigate("/admin/permissions"), 1500);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || t("admin.errorSubmittingForm");
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
          {isEdit ? t("admin.editPermission") : t("admin.addNewPermission")}
        </h2>
        <p className="text-gray-600">
          {isEdit ? t("admin.updatePermissionInfo") : t("admin.fillFormToAddPermission")}
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
                {t("admin.name")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Create User, Edit Role"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.code")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., create_user, edit_role"
                disabled={isEdit}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              {isEdit && (
                <p className="text-xs text-gray-500 mt-1">
                  {t("admin.codeCannotChange")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("admin.moduleName")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="module_name"
                value={formData.module_name}
                onChange={handleInputChange}
                placeholder="e.g., users, roles, permissions"
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
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Description */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 bg-[#E06666] text-white rounded-full flex items-center justify-center text-sm">
              2
            </span>
            {t("admin.description")}
          </h3>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t("admin.description")}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t("admin.descriptionPlaceholder")}
              rows="4"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] focus:border-transparent transition resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="border-t pt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/admin/permissions")}
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

export default PermissionFormPage;
