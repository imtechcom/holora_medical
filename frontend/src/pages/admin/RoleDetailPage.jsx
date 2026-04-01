import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import * as roleService from "../../services/roleService";
import * as permissionService from "../../services/permissionService";

const RoleDetailPage = () => {
  const { t } = useTranslation();
  const { roleId } = useParams();
  const navigate = useNavigate();

  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [assignedPermissions, setAssignedPermissions] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [roleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch role
      const roleResponse = await roleService.getRoleByIdApi(roleId);
      setRole(roleResponse.data);

      // Fetch all permissions
      const permResponse = await permissionService.getAllPermissionsApi();
      setPermissions(permResponse.data || []);

      // Extract unique modules
      const uniqueModules = [
        ...new Set(
          (permResponse.data || [])
            .filter((p) => p.module_name)
            .map((p) => p.module_name)
        ),
      ];
      setModules(uniqueModules);

      // Fetch role permissions
      const rolePermResponse = await roleService.getRolePermissionsApi(roleId);
      setAssignedPermissions(rolePermResponse.data || []);
      const assignedIds = rolePermResponse.data
        .filter((p) => p.is_assigned)
        .map((p) => p.id);
      setSelectedPermissions(assignedIds);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permissionId) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      // Get current assigned permissions
      const currentAssigned = assignedPermissions
        .filter((p) => p.is_assigned)
        .map((p) => p.id);

      // Permissions to add
      const toAdd = selectedPermissions.filter((id) => !currentAssigned.includes(id));

      // Permissions to remove
      const toRemove = currentAssigned.filter((id) => !selectedPermissions.includes(id));

      // Add new permissions
      for (const permissionId of toAdd) {
        await roleService.assignPermissionApi({
          role_id: roleId,
          permission_id: permissionId,
        });
      }

      // Remove revoked permissions
      for (const permissionId of toRemove) {
        await roleService.removePermissionApi({
          role_id: roleId,
          permission_id: permissionId,
        });
      }

      setSuccess(t("admin.updateRolePermissionsSuccess"));
      setTimeout(() => {
        fetchData();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save permissions");
      console.error("Error saving permissions:", err);
    } finally {
      setSaving(false);
    }
  };

  // Filter permissions
  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch =
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = !selectedModule || permission.module_name === selectedModule;

    return matchesSearch && matchesModule;
  });

  // Group permissions by module
  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    const module = perm.module_name || "General";
    if (!acc[module]) {
      acc[module] = [];
    }
    acc[module].push(perm);
    return acc;
  }, {});

  // Calculate stats
  const assignedCount = selectedPermissions.length;
  const totalCount = permissions.length;
  const unassignedCount = totalCount - assignedCount;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="text-center py-12 text-text-dim">
          {t("common.loading")}...
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="space-y-5">
        <div className="text-center py-12 text-red-500">
          {t("admin.roleNotFound")}
        </div>
        <div className="text-center">
          <button
            onClick={() => navigate("/admin/roles")}
            className="px-4 py-2 bg-[#E06666] text-white rounded-lg hover:bg-[#D55555]"
          >
            {t("admin.backToRoles")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/admin/roles")}
            className="mb-4 px-4 py-2 border border-border-main text-text-main rounded-lg hover:bg-bg-app transition-colors text-sm"
          >
            ← {t("admin.backToRoles")}
          </button>
          <h1 className="text-3xl font-bold text-text-main">{role.name}</h1>
          <p className="text-text-dim mt-2">
            {t("admin.roleCode")}: <code className="bg-bg-app px-2 py-1 rounded">{role.code}</code>
          </p>
        </div>
        {role.is_system_role && (
          <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
            {t("admin.systemRole")}
          </span>
        )}
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-4 p-4 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg dark:border-emerald-800/40 dark:bg-emerald-900/20 dark:text-emerald-400">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Role Info */}
        <div className="lg:col-span-1">
          <div className="bg-bg-surface rounded-2xl border border-border-main p-6 dark:bg-slate-800">

            <h2 className="text-xl font-bold text-text-main mb-4">
              {t("admin.roleInformation")}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-dim">{t("admin.name")}</label>
                <p className="font-medium text-text-main">{role.name}</p>
              </div>

              <div>
                <label className="text-sm text-text-dim">{t("admin.code")}</label>
                <p className="font-monospace text-text-main">{role.code}</p>
              </div>

              <div>
                <label className="text-sm text-text-dim">{t("admin.description")}</label>
                <p className="text-text-main">{role.description || "-"}</p>
              </div>

              <div>
                <label className="text-sm text-text-dim">{t("admin.status")}</label>
                <p className="mt-1">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      role.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-bg-app text-text-dim"
                    }`}
                  >
                    {role.status === "active"
                      ? t("admin.statusActive")
                      : t("admin.statusInactive")}
                  </span>
                </p>
              </div>

              <div>
                <label className="text-sm text-text-dim">{t("admin.userCount")}</label>
                <p className="text-2xl font-bold text-[#E06666]">{role.user_count || 0}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-bg-surface rounded-2xl border border-border-main p-6 mt-6 dark:bg-slate-800">
            <h3 className="text-lg font-bold text-text-main mb-4">
              {t("admin.permissionStats")}
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-text-dim">{t("admin.assigned")}</span>
                <span className="text-2xl font-bold text-green-600">{assignedCount}</span>
              </div>
              <div className="w-full bg-bg-app rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${totalCount > 0 ? (assignedCount / totalCount) * 100 : 0}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-text-dim">{t("admin.unassigned")}</span>
                <span className="text-2xl font-bold text-text-dim">{unassignedCount}</span>
              </div>

              <div className="text-sm text-text-dim mt-3">
                {t("admin.totalPermissions")}: {totalCount}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Permissions */}
        <div className="lg:col-span-2">
          <div className="bg-bg-surface rounded-2xl border border-border-main p-6 dark:bg-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-main">
                {t("admin.permissionsManagement")}
              </h2>
              {!role.is_system_role && (
                <button
                  onClick={handleSavePermissions}
                  disabled={saving}
                  className="px-6 py-2 bg-[#E06666] text-white rounded-lg hover:bg-[#D55555] transition-colors disabled:opacity-50"
                >
                  {saving ? t("common.saving") : t("common.save")}
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-wrap mb-6">
              <div className="flex-1 min-w-52">
                <input
                  type="text"
                  placeholder={t("admin.search")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 dark:bg-slate-700"
                />
              </div>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="px-4 py-2 border border-border-main bg-bg-app rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]/30 dark:bg-slate-700"
              >
                <option value="">{t("admin.allModules")}</option>
                {modules.map((module) => (
                  <option key={module} value={module}>
                    {module}
                  </option>
                ))}
              </select>
            </div>

            {/* Permissions List */}
            {Object.keys(groupedPermissions).length === 0 ? (
              <div className="text-center py-8 text-text-dim">
                {t("admin.noPermissionsFound")}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([module, perms]) => (
                  <div key={module} className="border border-border-main rounded-lg p-4">
                    <h3 className="font-semibold text-text-main mb-3 flex items-center gap-2">
                      <span className="text-lg">📦</span>
                      {module}
                      <span className="text-sm text-text-dim ml-2">
                        ({perms.filter((p) => selectedPermissions.includes(p.id)).length}/{perms.length})
                      </span>
                    </h3>
                    <div className="space-y-2">
                      {perms.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-center gap-3 p-3 hover:bg-bg-app rounded cursor-pointer transition-colors dark:hover:bg-slate-700"
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permission.id)}
                            onChange={() => handleTogglePermission(permission.id)}
                            disabled={saving || role.is_system_role}
                            className="w-4 h-4 text-[#E06666] rounded focus:ring-2 focus:ring-[#E06666]/30 disabled:opacity-50"
                          />
                          <div className="flex-1">
                              <div className="text-sm font-medium text-text-main">
                              {permission.name}
                            </div>
                            <div className="text-xs text-text-dim">
                              {permission.code}
                            </div>
                            {permission.description && (
                              <div className="text-xs text-text-dim mt-1">
                                {permission.description}
                              </div>
                            )}
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                              permission.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-bg-app text-text-dim"
                            }`}
                          >
                            {permission.status === "active"
                              ? t("admin.statusActive")
                              : t("admin.statusInactive")}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {role.is_system_role && (
              <div className="mt-6 p-4 border border-amber-200 bg-amber-50 text-amber-800 rounded-lg dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-400">
                <p className="text-sm">
                  ⚠️ {t("admin.systemRolePermissionsWarning")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleDetailPage;
