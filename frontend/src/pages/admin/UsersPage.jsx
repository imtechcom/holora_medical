import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  getAllUsersApi,
  createUserApi,
  updateUserApi,
  deleteUserApi,
} from "../../services/userService";

const UsersPage = () => {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    status: "active",
    password: "",
  });

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsersApi();
      setUsers(response.data || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || t("admin.deleteFailed"));
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingId) {
        // Update user
        await updateUserApi(editingId, {
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          status: formData.status,
          password: formData.password || undefined,
        });
        setSuccess(t("admin.updateSuccess"));
      } else {
        // Create user
        await createUserApi(formData);
        setSuccess(t("admin.createSuccess"));
      }

      resetForm();
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message || t("admin.createFailed"));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t("admin.confirmDelete"))) {
      return;
    }

    try {
      setError("");
      setSuccess("");
      await deleteUserApi(id);
      setSuccess(t("admin.deleteSuccess"));
      fetchUsers();
    } catch (err) {
      setError(err?.response?.data?.message || t("admin.deleteFailed"));
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setFormData({
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      phone: user.phone || "",
      status: user.status,
      password: "",
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingId(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      username: "",
      email: "",
      phone: "",
      status: "active",
      password: "",
    });
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
          onClick={handleAdd}
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
                        onClick={() => handleEdit(user)}
                        className="text-[#E06666] hover:underline font-semibold"
                      >
                        {t("admin.edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-[#E06666]">
              {editingId ? t("admin.editUser") : t("admin.addNewUser")}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("admin.fullName")}
                </label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E06666]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("admin.username")}
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled={!!editingId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E06666]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("admin.email")}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E06666]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("admin.phone")}
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E06666]"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("auth.password")}
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E06666]"
                  />
                </div>
              )}

              {editingId && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("auth.password")} ({t("admin.update")})
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Để trống nếu không muốn đổi mật khẩu"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E06666]"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  {t("admin.status")}
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#E06666]"
                >
                  <option value="active">{t("admin.statusActive")}</option>
                  <option value="inactive">{t("admin.statusInactive")}</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#E06666] text-white px-4 py-2 rounded-lg hover:bg-red-500 transition font-semibold"
                >
                  {editingId ? t("admin.update") : t("admin.create")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
                >
                  {t("admin.cancel")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;