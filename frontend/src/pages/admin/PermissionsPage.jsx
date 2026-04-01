import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import * as permissionService from "../../services/permissionService";

const PermissionsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => { fetchPermissions(); fetchModules(); }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true); setError("");
      const res = await permissionService.getAllPermissionsApi();
      setPermissions(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch permissions");
    } finally { setLoading(false); }
  };

  const fetchModules = async () => {
    try { const res = await permissionService.getModulesApi(); setModules(res.data || []); }
    catch (err) { console.error("Error fetching modules:", err); }
  };

  const handleDeletePermission = async (id) => {
    try {
      setError("");
      await permissionService.deletePermissionApi(id);
      setSuccess(t("admin.deletePermissionSuccess"));
      setShowDeleteConfirm(null);
      fetchPermissions();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete permission";
      setError(msg.includes("assigned") ? t("admin.cannotDeletePermissionWithRoles") : msg);
      setShowDeleteConfirm(null);
    }
  };

  const filteredPermissions = permissions.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = !selectedModule || p.module_name === selectedModule;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-main">{t("admin.permissionsManagement")}</h2>
          <p className="mt-0.5 text-sm text-text-dim">{t("admin.managePermissions")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPermissions} disabled={loading} className="inline-flex items-center gap-1.5 rounded-xl border border-border-main px-3 py-2 text-sm font-semibold text-text-main transition hover:bg-bg-app disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{t("common.refresh")}
          </button>
          <button onClick={() => navigate("/admin/permissions/new")} className="inline-flex items-center gap-1.5 rounded-xl bg-[#E06666] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#D55555]">
            <Plus className="h-4 w-4" />{t("admin.addNewPermission")}
          </button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-900/15 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />{success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/15 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />{error}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
          <input type="text" placeholder={t("admin.search")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-9 pr-4 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666]/40 dark:bg-slate-900" />
        </div>
        <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}
          className="rounded-xl border border-border-main bg-bg-app px-3 py-2.5 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666]/40 dark:bg-slate-900">
          <option value="">{t("admin.allModules")}</option>
          {modules.map((m) => <option key={m} value={m}>{m || t("common.other")}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-main bg-bg-app dark:bg-slate-900/60">
                {[t("admin.name"), t("admin.code"), t("admin.module"), t("admin.description"), t("admin.status"), t("common.actions")].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.07em] text-text-dim">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-text-dim"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{t("common.loading")}</span></td></tr>
              ) : filteredPermissions.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-text-dim">{t("admin.noPermissions")}</td></tr>
              ) : filteredPermissions.map((p) => (
                <tr key={p.id} className="hover:bg-bg-app dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 text-sm font-semibold text-text-main">{p.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <code className="rounded bg-bg-app px-2 py-1 text-xs font-mono text-text-dim dark:bg-slate-900">{p.code}</code>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-dim">{p.module_name || "—"}</td>
                  <td className="px-4 py-3 text-sm text-text-dim">{p.description || "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      p.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}>
                      {p.status === "active" ? t("admin.statusActive") : t("admin.statusInactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => navigate(`/admin/permissions/${p.id}/edit`)} className="inline-flex items-center gap-1 rounded-lg border border-border-main px-2.5 py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app">
                        <Pencil className="h-3 w-3" />{t("common.edit")}
                      </button>
                      <button onClick={() => setShowDeleteConfirm(p.id)} className="inline-flex items-center gap-1 rounded-lg border border-border-main px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50 dark:hover:bg-red-900/10">
                        <Trash2 className="h-3 w-3" />{t("common.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border-main bg-bg-surface p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-text-main">{t("admin.confirmDeletePermission")}</h3>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 rounded-xl border border-border-main py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app">{t("common.cancel")}</button>
              <button onClick={() => handleDeletePermission(showDeleteConfirm)} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700">{t("common.delete")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionsPage;
