import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import branchService from "../../services/branchService";

const BranchFormPage = ({ returnPath = "/admin/branches" }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { branchId } = useParams();
  const isEditMode = !!branchId;

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    description: "",
    status: "active",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const fetchBranch = useCallback(async () => {
    try {
      setLoading(true);
      const response = await branchService.getBranchById(branchId);
      const branch = response.data;
      setFormData({
        name: branch.name || "",
        code: branch.code || "",
        phone: branch.phone || "",
        email: branch.email || "",
        address: branch.address || "",
        city: branch.city || "",
        description: branch.description || "",
        status: branch.status || "active",
      });
    } catch (err) {
      setMessage(err?.response?.data?.message || t("branch.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [branchId, t]);

  useEffect(() => {
    if (isEditMode) {
      fetchBranch();
    }
  }, [isEditMode, fetchBranch]);

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = t("branch.nameRequired");
    }

    if (!formData.code.trim()) {
      nextErrors.code = t("branch.codeRequired");
    }

    if (formData.code.trim() && !/^[A-Z0-9_]+$/.test(formData.code.trim())) {
      nextErrors.code = t("branch.codeInvalid");
    }

    if (!formData.address.trim()) {
      nextErrors.address = t("branch.addressRequired");
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!validateForm()) {
      setMessage(t("common.pleaseFixErrors"));
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        description: formData.description.trim(),
        status: formData.status,
      };

      if (isEditMode) {
        await branchService.updateBranch(branchId, payload);
        setMessage(t("branch.updateSuccess"));
      } else {
        await branchService.createBranch(payload);
        setMessage(t("branch.createSuccess"));
      }

      setTimeout(() => {
        navigate(returnPath);
      }, 1000);
    } catch (err) {
      setMessage(err?.response?.data?.message || t("branch.saveError"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {isEditMode ? t("branch.editTitle") : t("branch.addTitle")}
          </h1>
          <p className="text-gray-600 text-sm mb-6">
            {isEditMode ? t("branch.editSubtitle") : t("branch.addSubtitle")}
          </p>

          {message && (
            <div
              className={`p-3 mb-4 rounded-md text-sm ${
                message.toLowerCase().includes("success") ||
                message.includes("thành công")
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                {t("branch.basicInfo")}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("branch.name")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("branch.namePlaceholder")}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("branch.code")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    placeholder={t("branch.codePlaceholder")}
                    disabled={isEditMode}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.code ? "border-red-500" : "border-gray-300"
                    } ${isEditMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  />
                  {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("branch.phone")}
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("branch.phonePlaceholder")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("branch.email")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t("branch.emailPlaceholder")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("branch.address")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder={t("branch.addressPlaceholder")}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.address ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("branch.city")}
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder={t("branch.cityPlaceholder")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("branch.status")}
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">{t("branch.statusActive")}</option>
                    <option value="inactive">{t("branch.statusInactive")}</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                {t("branch.description")}
              </h2>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder={t("branch.descriptionPlaceholder")}
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition"
              >
                {saving
                  ? t("common.saving")
                  : isEditMode
                    ? t("common.update")
                    : t("common.create")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/admin/branches")}
                disabled={saving}
                className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
              >
                {t("common.cancel")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BranchFormPage;
