import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
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
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });

  // Fetch roles on mount
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await roleService.getAllRolesApi();
      setRoles(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch roles");
      console.error("Error fetching roles:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = () => {
    setEditingId(null);
    setFormData({ name: "", code: "", description: "" });
    setShowModal(true);
    setError("");
  };

  const handleManagePermissions = (role) => {
    setSelectedRoleForPermissions(role);
    setShowPermissionsModal(true);
  };

  const handleEditRole = (role) => {
    setEditingId(role.id);
    setFormData({
      name: role.name,
      code: role.code,
      description: role.description,
    });
    setShowModal(true);
    setError("");
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.name.trim()) {
      setError(t("admin.nameRequired"));
      return;
    }
    if (!formData.code.trim()) {
      setError(t("admin.codeRequired"));
      return;
    }

    try {
      if (editingId) {
        // Update
        const response = await roleService.updateRoleApi(editingId, {
          name: formData.name,
          description: formData.description,
        });
        if (response) {
          setSuccess(t("admin.updateRoleSuccess"));
          setShowModal(false);
          fetchRoles();
        }
      } else {
        // Create
        const response = await roleService.createRoleApi({
          name: formData.name,
          code: formData.code,
          description: formData.description,
        });
        if (response) {
          setSuccess(t("admin.createRoleSuccess"));
          setShowModal(false);
          setFormData({ name: "", code: "", description: "" });
          fetchRoles();
        }
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Operation failed";
      if (errorMsg.includes("already exists")) {
        setError(t("admin.codeAlreadyExists"));
      } else {
        setError(errorMsg);
      }
    }
  };

  const handleDeleteRole = async (id, isSystemRole, userCount) => {
    if (isSystemRole) {
      setError(t("admin.cannotDeleteSystemRole"));
      setShowDeleteConfirm(null);
      return;
    }
    if (userCount > 0) {
      setError(t("admin.cannotDeleteRoleWithUsers"));
      setShowDeleteConfirm(null);
      return;
    }

    try {
      setError("");
      const response = await roleService.deleteRoleApi(id);
      if (response) {
        setSuccess(t("admin.deleteRoleSuccess"));
        setShowDeleteConfirm(null);
        fetchRoles();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete role";
      if (errorMsg.includes("cannot")) {
        setError(t("admin.cannotDeleteRoleWithUsers"));
      } else {
        setError(errorMsg);
      }
      setShowDeleteConfirm(null);
    }
  };

  // Filter roles based on search
  const filteredRoles = roles.filter(
    (role) =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("admin.rolesManagement")}
        </h1>
        <p className="text-gray-600 mt-2">{t("admin.manageSystemRoles")}</p>
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
              placeholder={t("admin.search")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleAddRole}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + {t("admin.addNewRole")}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            {t("common.loading")}...
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t("admin.noRoles")}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("admin.name")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("admin.code")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("admin.description")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("admin.userCount")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("admin.status")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("common.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredRoles.map((role) => (
                <tr key={role.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      {role.name}
                      {role.is_system_role && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                          {t("admin.systemRole")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {role.code}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {role.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                      {role.user_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      role.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}>
                      {role.status === "active"
                        ? t("admin.statusActive")
                        : t("admin.statusInactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => navigate(`/admin/roles/${role.id}`)}
                      className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      title="View role details"
                    >
                      👁️ {t("admin.details")}
                    </button>
                    <button
                      onClick={() => handleManagePermissions(role)}
                      className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors disabled:bg-gray-300"
                      disabled={role.is_system_role}
                      title={
                        role.is_system_role
                          ? "Cannot manage permissions for system role"
                          : "Manage permissions"
                      }
                    >
                      🔐 {t("admin.permissions")}
                    </button>
                    <button
                      onClick={() => handleEditRole(role)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-gray-300"
                      disabled={role.is_system_role}
                      title={
                        role.is_system_role
                          ? "Cannot edit system role"
                          : "Edit role"
                      }
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(role.id)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:bg-gray-300"
                      disabled={
                        role.is_system_role || (role.user_count || 0) > 0
                      }
                      title={
                        role.is_system_role
                          ? "Cannot delete system role"
                          : (role.user_count || 0) > 0
                          ? "Cannot delete role with assigned users"
                          : "Delete role"
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

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              {editingId ? t("admin.editRole") : t("admin.addNewRole")}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("admin.name")} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Manager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("admin.code")} * {editingId && "(Disabled for editing)"}
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  disabled={!!editingId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="e.g., manager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("admin.description")}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Optional description"
                  rows="3"
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingId ? t("common.update") : t("common.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {t("admin.confirmDeleteRole")}
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
                  const role = roles.find((r) => r.id === showDeleteConfirm);
                  handleDeleteRole(
                    showDeleteConfirm,
                    role?.is_system_role,
                    role?.user_count
                  );
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Permissions Modal */}
      {showPermissionsModal && selectedRoleForPermissions && (
        <RolePermissionsModal
          roleId={selectedRoleForPermissions.id}
          roleName={selectedRoleForPermissions.name}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedRoleForPermissions(null);
          }}
          onSuccess={fetchRoles}
        />
      )}
    </div>
  );
};

export default RolesPage;
