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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-text-main">
          {t("branch.managementTitle")}
        </h1>
        <p className="text-text-dim mt-2">{t("branch.managementSubtitle")}</p>
      </div>

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
          {success}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Search & Actions */}
      <div className="bg-bg-surface dark:bg-slate-800 rounded-lg shadow-sm border border-border-main p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex-1 w-full md:w-auto">
          <input
            type="text"
            placeholder={t("branch.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-border-main bg-bg-app dark:bg-slate-900 text-text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] placeholder-text-dim"
          />
        </div>
        <button
          onClick={() => navigate("/admin/branches/new")}
          className="px-6 py-2 bg-[#E06666] text-white rounded-lg hover:bg-[#D55555] transition-colors font-medium whitespace-nowrap shadow-sm"
        >
          + {t("branch.addNew")}
        </button>
      </div>

      {/* Table */}
      <div className="bg-bg-surface dark:bg-slate-800 rounded-lg shadow-sm border border-border-main overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#E06666] mx-auto mb-4"></div>
            <p className="text-text-dim">{t("common.loading")}...</p>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">🏥</div>
            <p className="text-text-dim">{t("branch.noBranches")}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-app dark:bg-slate-900 border-b border-border-main">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("branch.name")}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("branch.code")}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("branch.city")}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("branch.phone")}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("branch.status")}</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {filteredBranches.map((branch) => (
                <tr key={branch.id} className="hover:bg-bg-app dark:hover:bg-slate-700/50 transition">
                  <td className="px-6 py-4 font-medium text-text-main">{branch.name}</td>
                  <td className="px-6 py-4 text-text-dim">
                    <code className="bg-bg-app dark:bg-slate-900 px-2.5 py-1 rounded text-xs font-mono">{branch.code}</code>
                  </td>
                  <td className="px-6 py-4 text-text-dim">{branch.city || "-"}</td>
                  <td className="px-6 py-4 text-text-dim">{branch.phone || "-"}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        branch.status === "active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {branch.status === "active"
                        ? t("branch.statusActive")
                        : t("branch.statusInactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/admin/branches/${branch.id}/edit`)}
                        className="px-3 py-1 bg-[#E06666] text-white rounded hover:bg-[#D55555] transition-colors text-xs font-medium"
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(branch.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-xs font-medium"
                      >
                        {t("common.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-sm w-full mx-4 border border-border-main">
            <h3 className="text-lg font-bold text-text-main mb-4">{t("branch.confirmDelete")}</h3>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-border-main text-text-main rounded-lg hover:bg-bg-app dark:hover:bg-slate-700 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
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
