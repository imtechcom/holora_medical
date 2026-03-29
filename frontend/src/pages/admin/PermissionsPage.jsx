import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import * as permissionService from "../../services/permissionService";

const PermissionsPage = () => {
  const { t } = useTranslation();
  const [permissions, setPermissions] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    module_name: "",
    description: "",
    status: "active",
  });

  // Fetch permissions and modules on mount
  useEffect(() => {
    fetchPermissions();
    fetchModules();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await permissionService.getAllPermissionsApi();
      setPermissions(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch permissions");
      console.error("Error fetching permissions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await permissionService.getModulesApi();
      setModules(response.data || []);
    } catch (err) {
      console.error("Error fetching modules:", err);
    }
  };

  const handleAddPermission = () => {
    setEditingId(null);
    setFormData({
      name: "",
      code: "",
      module_name: "",
      description: "",
      status: "active",
    });
    setShowModal(true);
    setError("");
  };

  const handleEditPermission = (permission) => {
    setEditingId(permission.id);
    setFormData({
      name: permission.name,
      code: permission.code,
      module_name: permission.module_name,
      description: permission.description,
      status: permission.status,
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
        const response = await permissionService.updatePermissionApi(editingId, {
          name: formData.name,
          module_name: formData.module_name,
          description: formData.description,
          status: formData.status,
        });
        if (response) {
          setSuccess(t("admin.updatePermissionSuccess"));
          setShowModal(false);
          fetchPermissions();
        }
      } else {
        // Create
        const response = await permissionService.createPermissionApi({
          name: formData.name,
          code: formData.code,
          module_name: formData.module_name,
          description: formData.description,
          status: formData.status,
        });
        if (response) {
          setSuccess(t("admin.createPermissionSuccess"));
          setShowModal(false);
          setFormData({
            name: "",
            code: "",
            module_name: "",
            description: "",
            status: "active",
          });
          fetchPermissions();
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

  const handleDeletePermission = async (id) => {
    try {
      setError("");
      const response = await permissionService.deletePermissionApi(id);
      if (response) {
        setSuccess(t("admin.deletePermissionSuccess"));
        setShowDeleteConfirm(null);
        fetchPermissions();
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Failed to delete permission";
      if (errorMsg.includes("assigned")) {
        setError(t("admin.cannotDeletePermissionWithRoles"));
      } else {
        setError(errorMsg);
      }
      setShowDeleteConfirm(null);
    }
  };

  // Filter permissions based on search and module filter
  const filteredPermissions = permissions.filter((permission) => {
    const matchesSearch =
      permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModule = !selectedModule || permission.module_name === selectedModule;

    return matchesSearch && matchesModule;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("admin.permissionsManagement")}
        </h1>
        <p className="text-gray-600 mt-2">{t("admin.managePermissions")}</p>
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
          <div className="flex-1 flex gap-4 flex-wrap">
            <div className="flex-1 min-w-52">
              <input
                type="text"
                placeholder={t("admin.search")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t("admin.allModules")}</option>
              {modules.map((module) => (
                <option key={module} value={module}>
                  {module || t("common.other")}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddPermission}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            + {t("admin.addNewPermission")}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            {t("common.loading")}...
          </div>
        ) : filteredPermissions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t("admin.noPermissions")}
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
                  {t("admin.module")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  {t("admin.description")}
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
              {filteredPermissions.map((permission) => (
                <tr key={permission.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {permission.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <code className="bg-gray-100 px-2 py-1 rounded">
                      {permission.code}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {permission.module_name || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {permission.description || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        permission.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {permission.status === "active"
                        ? t("admin.statusActive")
                        : t("admin.statusInactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm flex gap-2">
                    <button
                      onClick={() => handleEditPermission(permission)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      {t("common.edit")}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(permission.id)}
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

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              {editingId
                ? t("admin.editPermission")
                : t("admin.addNewPermission")}
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
                  placeholder="e.g., Manage Users"
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
                  placeholder="e.g., user.manage"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("admin.module")}
                </label>
                <select
                  value={formData.module_name || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      module_name: e.target.value || null,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">{t("common.selectOne")}</option>
                  {modules.map((module) => (
                    <option key={module} value={module}>
                      {module}
                    </option>
                  ))}
                  <option value="__new__">{t("admin.addNewModule")}</option>
                </select>
                {formData.module_name === "__new__" && (
                  <input
                    type="text"
                    placeholder="Enter new module name"
                    onChange={(e) =>
                      setFormData({ ...formData, module_name: e.target.value })
                    }
                    className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
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
                  rows="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("admin.status")}
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">{t("admin.statusActive")}</option>
                  <option value="inactive">{t("admin.statusInactive")}</option>
                </select>
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
              {t("admin.confirmDeletePermission")}
            </h3>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={() => handleDeletePermission(showDeleteConfirm)}
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

export default PermissionsPage;
