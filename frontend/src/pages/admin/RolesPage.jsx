import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Eye, Loader2, Lock, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import * as roleService from "../../services/roleService";
import RolePermissionsModal from "../../components/RolePermissionsModal";

const RolesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState(null);

  useEffect(() => { fetchRoles(); }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await roleService.getAllRolesApi();
      setRoles(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id, isSystemRole, userCount) => {
    if (isSystemRole) { setError(t("admin.cannotDeleteSystemRole")); setShowDeleteConfirm(null); return; }
    if (userCount > 0) { setError(t("admin.cannotDeleteRoleWithUsers")); setShowDeleteConfirm(null); return; }
    try {
      setError("");
      await roleService.deleteRoleApi(id);
      setSuccess(t("admin.deleteRoleSuccess"));
      setShowDeleteConfirm(null);
      fetchRoles();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to delete role";
      setError(msg.includes("cannot") ? t("admin.cannotDeleteRoleWithUsers") : msg);
      setShowDeleteConfirm(null);
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-main">{t("admin.rolesManagement")}</h2>
          <p className="mt-0.5 text-sm text-text-dim">{t("admin.manageSystemRoles")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchRoles} disabled={loading} className="inline-flex items-center gap-1.5 rounded-xl border border-border-main px-3 py-2 text-sm font-semibold text-text-main transition hover:bg-bg-app disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{t("common.refresh")}
          </button>
          <button onClick={() => navigate("/admin/roles/new")} className="inline-flex items-center gap-1.5 rounded-xl bg-[#E06666] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#D55555]">
            <Plus className="h-4 w-4" />{t("admin.addNewRole")}
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

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
        <input type="text" placeholder={t("admin.search")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-9 pr-4 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666]/40 dark:bg-slate-900" />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-main bg-bg-app dark:bg-slate-900/60">
                {[t("admin.name"), t("admin.code"), t("admin.description"), t("admin.userCount"), t("admin.status"), t("common.actions")].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.07em] text-text-dim">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-text-dim"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />{t("common.loading")}</span></td></tr>
              ) : filteredRoles.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-text-dim">{t("admin.noRoles")}</td></tr>
              ) : filteredRoles.map((role) => (
                <tr key={role.id} className="hover:bg-bg-app dark:hover:bg-slate-900/40">
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-main">{role.name}</span>
                      {role.is_system_role && (
                        <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">{t("admin.systemRole")}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <code className="rounded bg-bg-app px-2 py-1 text-xs font-mono text-text-dim dark:bg-slate-900">{role.code}</code>
                  </td>
                  <td className="px-4 py-3 text-sm text-text-dim">{role.description || "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex rounded-full border border-border-main bg-bg-app px-3 py-1 text-xs font-semibold text-text-main dark:bg-slate-900">{role.user_count || 0}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      role.status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                    }`}>
                      {role.status === "active" ? t("admin.statusActive") : t("admin.statusInactive")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button onClick={() => navigate(`/admin/roles/${role.id}`)} className="inline-flex items-center gap-1 rounded-lg border border-border-main px-2.5 py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app">
                        <Eye className="h-3 w-3" />{t("admin.details")}
                      </button>
                      <button onClick={() => { setSelectedRoleForPermissions(role); setShowPermissionsModal(true); }} disabled={role.is_system_role}
                        className="inline-flex items-center gap-1 rounded-lg border border-border-main px-2.5 py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app disabled:cursor-not-allowed disabled:opacity-40">
                        <Lock className="h-3 w-3" />{t("admin.permissions")}
                      </button>
                      <button onClick={() => navigate(`/admin/roles/${role.id}/edit`)} disabled={role.is_system_role}
                        className="inline-flex items-center gap-1 rounded-lg border border-border-main px-2.5 py-1.5 text-xs font-semibold text-text-main transition hover:bg-bg-app disabled:cursor-not-allowed disabled:opacity-40">
                        <Pencil className="h-3 w-3" />{t("common.edit")}
                      </button>
                      <button onClick={() => setShowDeleteConfirm(role.id)} disabled={role.is_system_role || (role.user_count || 0) > 0}
                        className="inline-flex items-center gap-1 rounded-lg border border-border-main px-2.5 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-red-900/10">
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
            <h3 className="text-base font-bold text-text-main">{t("admin.confirmDeleteRole")}</h3>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 rounded-xl border border-border-main py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app">{t("common.cancel")}</button>
              <button onClick={() => { const r = roles.find((x) => x.id === showDeleteConfirm); handleDeleteRole(showDeleteConfirm, r?.is_system_role, r?.user_count); }}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700">{t("common.delete")}</button>
            </div>
          </div>
        </div>
      )}

      {showPermissionsModal && selectedRoleForPermissions && (
        <RolePermissionsModal
          roleId={selectedRoleForPermissions.id}
          roleName={selectedRoleForPermissions.name}
          onClose={() => { setShowPermissionsModal(false); setSelectedRoleForPermissions(null); }}
          onSuccess={fetchRoles}
        />
      )}
    </div>
  );
};

export default RolesPage;
