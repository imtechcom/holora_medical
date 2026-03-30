import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  getAvailableRolesApi,
  getUserRolesApi,
  assignRoleToUserApi,
  removeRoleFromUserApi,
} from "../services/userRoleService";

const AssignUserRoleModal = ({ user_id, user_name, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [availableRoles, setAvailableRoles] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const [available, current] = await Promise.all([
        getAvailableRolesApi(user_id),
        getUserRolesApi(user_id),
      ]);
      setAvailableRoles(available || []);
      setUserRoles(current || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleAssignRole = async () => {
    if (!selectedRole) {
      alert(t("admin.selectRole"));
      return;
    }

    try {
      setAssigning(true);
      await assignRoleToUserApi(user_id, selectedRole);
      setSelectedRole("");
      await fetchRoles();
      onSuccess?.();
    } catch (error) {
      console.error("Error assigning role:", error);
      alert(t("admin.assignRoleFailed"));
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveRole = async (role_id) => {
    if (window.confirm(t("admin.confirmRemoveRole"))) {
      try {
        await removeRoleFromUserApi(user_id, role_id);
        await fetchRoles();
        onSuccess?.();
      } catch (error) {
        console.error("Error removing role:", error);
        alert(t("admin.removeRoleFailed"));
      }
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
          <div className="flex justify-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-[#E06666] border-r-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-2xl max-h-96 overflow-y-auto">
        <h3 className="text-xl font-bold text-[#E06666] mb-4">
          {t("admin.assignRolesToUser")} - {user_name}
        </h3>

        {/* Current Roles */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3">
            {t("admin.currentRoles")}
          </h4>
          {userRoles.length > 0 ? (
            <div className="space-y-2">
              {userRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-800">{role.name}</p>
                    <p className="text-sm text-gray-600">
                      {t("admin.assignedAt")}: {new Date(role.assigned_at).toLocaleDateString()}
                      {role.assigned_by_name && ` (${t("admin.by")} ${role.assigned_by_name})`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveRole(role.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                  >
                    {t("common.delete")}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">{t("admin.noRolesAssigned")}</p>
          )}
        </div>

        {/* Assign New Role */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-700 mb-3">
            {t("admin.assignNewRole")}
          </h4>
          <div className="flex gap-2">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]"
            >
              <option value="">{t("admin.selectRole")}</option>
              {availableRoles
                .filter((r) => !r.is_assigned)
                .map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
            </select>
            <button
              onClick={handleAssignRole}
              disabled={assigning || !selectedRole}
              className="px-4 py-2 bg-[#E06666] text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 transition"
            >
              {assigning ? t("common.saving") : t("admin.assign")}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignUserRoleModal;
