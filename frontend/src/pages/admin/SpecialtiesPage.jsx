import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import specialtyService from "../../services/specialtyService";

const SpecialtiesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Fetch specialties on mount
  const fetchSpecialties = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await specialtyService.getAllSpecialties();
      setSpecialties(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || t("specialty.fetchError"));
      console.error("Error fetching specialties:", err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  const handleAddSpecialty = () => {
    navigate("/admin/specialties/new");
  };

  const handleEditSpecialty = (specialty) => {
    navigate(`/admin/specialties/${specialty.id}/edit`);
  };

  const handleDeleteSpecialty = async (id, doctorCount) => {
    if (doctorCount > 0) {
      setError(t("specialty.cannotDeleteWithDoctors"));
      setShowDeleteConfirm(null);
      return;
    }

    try {
      setError("");
      setSuccess("");
      const response = await specialtyService.deleteSpecialty(id);
      if (response) {
        setSuccess(t("specialty.deleteSuccess"));
        setShowDeleteConfirm(null);
        fetchSpecialties();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || t("specialty.deleteError");
      if (errorMsg.includes("cannot") || errorMsg.includes("assigned")) {
        setError(t("specialty.cannotDeleteWithDoctors"));
      } else {
        setError(errorMsg);
      }
      setShowDeleteConfirm(null);
    }
  };

  // Filter specialties based on search
  const filteredSpecialties = specialties.filter(
    (specialty) =>
      specialty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      specialty.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("specialty.managementTitle")}
        </h1>
        <p className="text-gray-600 mt-2">{t("specialty.managementSubtitle")}</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <input
              type="text"
              placeholder={t("common.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleAddSpecialty}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + {t("specialty.addNew")}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            {t("common.loading")}...
          </div>
        ) : filteredSpecialties.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t("specialty.noSpecialties")}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("specialty.name")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("specialty.code")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("specialty.description")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("specialty.doctorCount")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("specialty.status")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSpecialties.map((specialty) => (
                <tr key={specialty.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {specialty.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {specialty.code}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {specialty.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {specialty.doctor_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      specialty.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {specialty.status === "active"
                        ? t("common.active")
                        : t("common.inactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => handleEditSpecialty(specialty)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      title={t("common.edit")}
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(specialty.id)}
                      className={`px-3 py-1 text-white rounded transition-colors ${
                        (specialty.doctor_count || 0) > 0
                          ? "bg-gray-300 cursor-not-allowed"
                          : "bg-red-500 hover:bg-red-600"
                      }`}
                      disabled={(specialty.doctor_count || 0) > 0}
                      title={
                        (specialty.doctor_count || 0) > 0
                          ? t("specialty.cannotDeleteWithDoctors")
                          : t("common.delete")
                      }
                    >
                      {t("common.delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {t("specialty.confirmDelete")}
            </h3>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => {
                  const specialty = specialties.find(
                    (s) => s.id === showDeleteConfirm
                  );
                  handleDeleteSpecialty(showDeleteConfirm, specialty?.doctor_count);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialtiesPage;
