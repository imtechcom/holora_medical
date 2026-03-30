import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getAllPatientsApi,
  deletePatientApi,
} from "../../services/patientService";

const PatientsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await getAllPatientsApi();
      setPatients(res.data || []);
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleAddClick = () => {
    navigate("/admin/patients/new");
  };

  const handleEditClick = (patient) => {
    navigate(`/admin/patients/${patient.id}/edit`);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deletePatientApi(deleteId);
      setPatients(patients.filter((p) => p.id !== deleteId));
      setShowDeleteConfirm(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting patient:", error);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.full_name?.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower) ||
      patient.phone?.includes(searchLower) ||
      patient.patient_code?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-yellow-100 text-yellow-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getGenderBadge = (gender) => {
    const colors = {
      male: "bg-blue-100 text-blue-800",
      female: "bg-pink-100 text-pink-800",
      other: "bg-purple-100 text-purple-800",
    };
    return colors[gender] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm text-center">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-[#E06666] border-r-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#E06666] mb-2">
            {t("admin.patientsManagement")}
          </h2>
          <p className="text-gray-600">{t("admin.managePatientsAndRecords")}</p>
        </div>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-[#E06666] text-white rounded-lg hover:bg-red-600 transition"
        >
          + {t("admin.addNewPatient")}
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder={t("admin.searchByName")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E06666]"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left p-3 font-semibold text-gray-700">
                {t("admin.patientCode")}
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">
                {t("admin.fullName")}
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">
                {t("admin.phone")}
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">
                {t("admin.email")}
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">
                {t("admin.branches")}
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">
                {t("admin.gender")}
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">
                {t("admin.bloodGroup")}
              </th>
              <th className="text-left p-3 font-semibold text-gray-700">
                {t("admin.status")}
              </th>
              <th className="text-center p-3 font-semibold text-gray-700">
                {t("common.actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center p-6 text-gray-500">
                  {t("admin.noPatientsFound")}
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => (
                <tr key={patient.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 text-sm">{patient.patient_code}</td>
                  <td className="p-3 text-sm font-medium">{patient.full_name}</td>
                  <td className="p-3 text-sm">{patient.phone}</td>
                  <td className="p-3 text-sm">{patient.email}</td>
                  <td className="p-3 text-sm">
                    {patient.branch_names ? (
                      <span className="text-gray-700">{patient.branch_names}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-sm">
                    {patient.gender && (
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getGenderBadge(
                          patient.gender
                        )}`}
                      >
                        {t(`admin.gender${patient.gender.charAt(0).toUpperCase()}${patient.gender.slice(1)}`)}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-sm">
                    {patient.blood_group && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">
                        {patient.blood_group}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        patient.status
                      )}`}
                    >
                      {patient.status === "active"
                        ? t("admin.statusActive")
                        : patient.status === "inactive"
                        ? t("admin.statusInactive")
                        : "Blocked"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleEditClick(patient)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteClick(patient.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {t("admin.confirmDelete")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("admin.deletePatientConfirmation")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {t("admin.confirmDelete")}
            </h3>
            <p className="text-gray-600 mb-6">
              {t("admin.deletePatientConfirmation")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
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

export default PatientsPage;