import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getAllUsersApi,
  deleteUserApi,
} from "../../services/userService";
import AssignUserRoleModal from "../../components/AssignUserRoleModal";

const UsersPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    userId: null,
    userName: "",
  });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAllUsersApi();
      setUsers(res.data || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to fetch users");
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    navigate("/admin/users/new");
  };

  const handleEditClick = (user) => {
    navigate(`/admin/users/${user.id}/edit`);
  };

  const handleDeleteClick = (user) => {
    setDeleteModal({
      show: true,
      userId: user.id,
      userName: user.full_name,
    });
  };

  const handleManageRoles = (user) => {
    setSelectedUserForRole(user);
    setShowRoleModal(true);
  };

  const handleRoleModalClose = () => {
    setShowRoleModal(false);
    setSelectedUserForRole(null);
    fetchUsers(); // Refresh to get updated roles
  };

  const confirmDelete = async () => {
    const userId = deleteModal.userId;
    setDeleteModal({ show: false, userId: null, userName: "" });

    try {
      setError("");
      setSuccess("");
      await deleteUserApi(userId);
      setSuccess(t("admin.deleteSuccess"));
      fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message || t("admin.deleteFailed"));
    }
  };

  const filteredUsers = users.filter((user) =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#E06666]">
          {t("admin.usersManagement")}
        </h2>
        <button
          onClick={handleAddClick}
          className="bg-[#E06666] text-white px-6 py-2 rounded-lg hover:bg-red-500 transition"
        >
          + {t("admin.addNewUser")}
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
          {success}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder={t("admin.search")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E06666]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-gray-500">{t("admin.loading")}</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6 text-center text-gray-500">{t("admin.noUsers")}</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t("admin.id")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t("admin.fullName")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t("admin.email")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t("admin.phone")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t("admin.roles")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t("admin.status")}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  {t("admin.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-sm text-gray-900">{user.id}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {user.full_name}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">{user.email}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {user.phone || "-"}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {user.roles || "-"}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.status === "active"
                        ? t("admin.statusActive")
                        : t("admin.statusInactive")}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleManageRoles(user)}
                        className="text-purple-600 hover:underline font-semibold"
                        title="Assign or manage roles for this user"
                      >
                        🔐 {t("admin.roles")}
                      </button>
                      <button
                        onClick={() => handleEditClick(user)}
                        className="text-[#E06666] hover:underline font-semibold"
                      >
                        {t("admin.edit")}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="text-red-600 hover:underline font-semibold"
                      >
                        {t("admin.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4 text-gray-900">
              {t("admin.confirmDelete")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("admin.deleteWarning")} "{deleteModal.userName}"?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-semibold"
              >
                {t("admin.delete")}
              </button>
              <button
                onClick={() =>
                  setDeleteModal({ show: false, userId: null, userName: "" })
                }
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                {t("admin.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {showRoleModal && selectedUserForRole && (
        <AssignUserRoleModal
          userId={selectedUserForRole.id}
          userName={selectedUserForRole.full_name}
          onClose={handleRoleModalClose}
        />
      )}
    </div>
  );
};

export default UsersPage;