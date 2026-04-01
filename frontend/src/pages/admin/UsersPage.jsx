import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Pencil, ShieldEllipsis, Trash2 } from "lucide-react";
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
      <div>
        <h1 className="text-3xl font-bold text-text-main">
          {t("admin.usersManagement")}
        </h1>
        <p className="text-text-dim mt-2">{t("admin.manageUsersDescription")}</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-bg-surface dark:bg-slate-800 rounded-lg shadow-sm border border-border-main p-4">
        <input
          type="text"
          placeholder={t("admin.search")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-border-main bg-bg-app dark:bg-slate-900 text-text-main rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666] placeholder-text-dim"
        />
        <button
          onClick={handleAddClick}
          className="px-6 py-2 bg-[#E06666] text-white rounded-lg hover:bg-[#D55555] transition-colors font-medium whitespace-nowrap shadow-sm"
        >
          + {t("admin.addNewUser")}
        </button>
      </div>

      {/* Table */}
      <div className="bg-bg-surface dark:bg-slate-800 rounded-lg shadow-sm border border-border-main overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-8 h-8 border-2 border-[#E06666] border-r-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-text-dim">{t("admin.loading")}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-text-dim">
            <p className="text-2xl mb-2">📋</p>
            <p>{t("admin.noUsers")}</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-bg-app dark:bg-slate-900 border-b border-border-main">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                  {t("admin.id")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                  {t("admin.fullName")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                  {t("admin.email")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                  {t("admin.phone")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                  {t("admin.roles")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                  {t("admin.status")}
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-text-dim">
                  {t("admin.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-bg-app dark:hover:bg-slate-700/50 transition">
                  <td className="px-6 py-4 text-sm">
                    <code className="bg-bg-app dark:bg-slate-900 px-2.5 py-1 rounded text-xs font-mono text-text-main">
                      {user.id}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-text-main">
                    {user.full_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-main">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-text-dim">
                    {user.phone || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-text-dim">
                    {user.roles || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === "active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {user.status === "active"
                        ? t("admin.statusActive")
                        : t("admin.statusInactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleManageRoles(user)}
                        title="Assign or manage roles for this user"
                        className="rounded-lg border border-border-main p-1.5 text-text-dim hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/20 transition"
                      >
                        <ShieldEllipsis className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleEditClick(user)}
                        className="rounded-lg border border-border-main p-1.5 text-text-dim hover:border-[#E06666]/50 hover:bg-[#E06666]/10 hover:text-[#E06666] transition"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="rounded-lg border border-border-main p-1.5 text-text-dim hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-surface dark:bg-slate-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-border-main">
            <h3 className="text-lg font-bold text-text-main mb-4">
              {t("admin.confirmDelete")}
            </h3>
            <p className="text-text-dim mb-6">
              {t("admin.deleteWarning")} "{deleteModal.userName}"?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                {t("admin.delete")}
              </button>
              <button
                onClick={() =>
                  setDeleteModal({ show: false, userId: null, userName: "" })
                }
                className="flex-1 border border-border-main text-text-main px-4 py-2 rounded-lg hover:bg-bg-app dark:hover:bg-slate-700 transition-colors font-medium"
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