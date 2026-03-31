import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getDoctorsByOwnerBranchesApi, deleteDoctorApi } from "../../services/doctorService";

const MyDoctorsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const fetchDoctors = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getDoctorsByOwnerBranchesApi();
      setDoctors(res.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || t("admin.errorLoadingDoctors") || "Failed to load doctors");
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleDelete = async (id) => {
    try {
      setError("");
      setSuccess("");
      await deleteDoctorApi(id);
      setSuccess(t("admin.doctorDeletedSuccess") || "Doctor deleted successfully");
      setShowDeleteConfirm(null);
      fetchDoctors();
    } catch (err) {
      setError(err?.response?.data?.message || t("admin.errorDeletingDoctor") || "Failed to delete doctor");
      setShowDeleteConfirm(null);
    }
  };

  const filtered = doctors.filter((d) => {
    const kw = searchTerm.toLowerCase();
    return (
      d.full_name?.toLowerCase().includes(kw) ||
      d.specialty_name?.toLowerCase().includes(kw) ||
      d.branch_names?.toLowerCase().includes(kw) ||
      d.email?.toLowerCase().includes(kw)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("clinicOwner.myDoctors") || "My Doctors"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("clinicOwner.myDoctorsSubtitle") || "Doctors across all your branches"}
          </p>
        </div>
        <button
          onClick={() => navigate("/clinic-owner/doctors/new")}
          className="bg-[#E06666] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#D55555] transition shadow-sm"
        >
          + {t("admin.addNewDoctor") || "Add Doctor"}
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t("admin.searchDoctors") || "Search by name, specialty, branch..."}
          className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E06666]"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#E06666]"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">👨‍⚕️</div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            {searchTerm
              ? t("admin.noDoctorsFound") || "No doctors match your search"
              : t("clinicOwner.noDoctors") || "No doctors yet"}
          </h3>
          {!searchTerm && (
            <p className="text-gray-400 text-sm mb-6">
              {t("clinicOwner.noDoctorsHint") || "Add doctors to your branches to get started."}
            </p>
          )}
          {!searchTerm && (
            <button
              onClick={() => navigate("/clinic-owner/doctors/new")}
              className="bg-[#E06666] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#D55555] transition"
            >
              + {t("admin.addNewDoctor") || "Add Doctor"}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t("admin.doctor") || "Doctor"}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t("admin.specialty") || "Specialty"}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t("branch.managementTitle") || "Branches"}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t("common.status") || "Status"}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {t("common.actions") || "Actions"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{doctor.full_name}</div>
                    {doctor.email && (
                      <div className="text-xs text-gray-400">{doctor.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{doctor.specialty_name || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{doctor.branch_names || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        doctor.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {doctor.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/clinic-owner/doctors/${doctor.id}/edit`)}
                        className="text-[#E06666] hover:text-[#D55555] text-xs font-medium"
                      >
                        {t("common.edit") || "Edit"}
                      </button>
                      <span className="text-gray-200">|</span>
                      <button
                        onClick={() => setShowDeleteConfirm(doctor.id)}
                        className="text-red-400 hover:text-red-600 text-xs font-medium"
                      >
                        {t("common.delete") || "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("admin.confirmDeleteDoctor") || "Delete Doctor?"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {t("admin.confirmDeleteDoctorText") || "This action cannot be undone."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                {t("common.cancel") || "Cancel"}
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition"
              >
                {t("common.delete") || "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyDoctorsPage;
