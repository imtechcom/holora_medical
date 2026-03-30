import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import branchService from "../../services/branchService";

const BranchesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await branchService.getAllBranches();
      setBranches(response.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || t("branch.fetchError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const filteredBranches = branches.filter((branch) => {
    const keyword = searchTerm.toLowerCase();
    return (
      branch.name?.toLowerCase().includes(keyword) ||
      branch.code?.toLowerCase().includes(keyword) ||
      branch.city?.toLowerCase().includes(keyword)
    );
  });

  const handleDelete = async (id) => {
    try {
      setError("");
      setSuccess("");
      await branchService.deleteBranch(id);
      setSuccess(t("branch.deleteSuccess"));
      setShowDeleteConfirm(null);
      fetchBranches();
    } catch (err) {
      setError(err?.response?.data?.message || t("branch.deleteError"));
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("branch.managementTitle")}
        </h1>
        <p className="text-gray-600 mt-2">{t("branch.managementSubtitle")}</p>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <input
              type="text"
              placeholder={t("branch.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => navigate("/admin/branches/new")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + {t("branch.addNew")}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">{t("common.loading")}...</div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t("branch.noBranches")}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{t("branch.name")}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{t("branch.code")}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{t("branch.city")}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{t("branch.phone")}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{t("branch.status")}</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredBranches.map((branch) => (
                <tr key={branch.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{branch.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <code className="bg-gray-100 px-2 py-1 rounded">{branch.code}</code>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{branch.city || "-"}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{branch.phone || "-"}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        branch.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {branch.status === "active"
                        ? t("branch.statusActive")
                        : t("branch.statusInactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/branches/${branch.id}/edit`)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(branch.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
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

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t("branch.confirmDelete")}</h3>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
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

export default BranchesPage;
