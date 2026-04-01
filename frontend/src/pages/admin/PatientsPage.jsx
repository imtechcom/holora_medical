import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loader2, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import {
  getAllPatientsApi,
  deletePatientApi,
} from "../../services/patientService";

const STATUS_STYLES = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  inactive: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const GENDER_STYLES = {
  male: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  female: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  other: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-main">{t("admin.patientsManagement")}</h2>
          <p className="mt-0.5 text-sm text-text-dim">{t("admin.managePatientsAndRecords")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchPatients}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border-main px-3 py-2 text-sm font-semibold text-text-main transition hover:bg-bg-app disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {t("common.refresh")}
          </button>
          <button
            onClick={() => navigate("/admin/patients/new")}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#E06666] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#D55555]"
          >
            <Plus className="h-4 w-4" />
            {t("admin.addNewPatient")}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
        <input
          type="text"
          placeholder={t("admin.searchByName")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-border-main bg-bg-app py-2.5 pl-9 pr-4 text-sm text-text-main outline-none transition focus:ring-2 focus:ring-[#E06666]/40 dark:bg-slate-900"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-border-main bg-bg-app dark:bg-slate-900/60">
                {[
                  t("admin.patientCode"),
                  t("admin.fullName"),
                  t("admin.phone"),
                  t("admin.email"),
                  t("admin.branches"),
                  t("admin.gender"),
                  t("admin.bloodGroup"),
                  t("admin.status"),
                  t("common.actions"),
                ].map((h, i) => (
                  <th
                    key={i}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-[0.07em] text-text-dim ${
                      i >= 8 ? "text-center" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-text-dim">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("common.loading")}
                    </span>
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-sm text-text-dim">
                    {t("admin.noPatientsFound")}
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-bg-app dark:hover:bg-slate-900/40">
                    <td className="px-4 py-3 text-sm font-mono text-text-dim">{patient.patient_code}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-text-main">{patient.full_name}</td>
                    <td className="px-4 py-3 text-sm text-text-dim">{patient.phone}</td>
                    <td className="px-4 py-3 text-sm text-text-dim">{patient.email}</td>
                    <td className="px-4 py-3 text-sm text-text-main">{patient.branch_names || <span className="text-text-dim">—</span>}</td>
                    <td className="px-4 py-3 text-sm">
                      {patient.gender ? (
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            GENDER_STYLES[patient.gender] || "bg-slate-100 text-slate-600 dark:bg-slate-700"
                          }`}
                        >
                          {t(`admin.gender${patient.gender.charAt(0).toUpperCase()}${patient.gender.slice(1)}`)}
                        </span>
                      ) : <span className="text-text-dim">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {patient.blood_group ? (
                        <span className="inline-flex rounded-full border border-border-main bg-bg-app px-3 py-1 text-xs font-semibold text-text-main dark:bg-slate-900">
                          {patient.blood_group}
                        </span>
                      ) : <span className="text-text-dim">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          STATUS_STYLES[patient.status] || "bg-slate-100 text-slate-600 dark:bg-slate-700"
                        }`}
                      >
                        {patient.status === "active"
                          ? t("admin.statusActive")
                          : patient.status === "inactive"
                          ? t("admin.statusInactive")
                          : patient.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/patients/${patient.id}/edit`)}
                          className="rounded-lg border border-border-main p-1.5 text-text-dim transition hover:border-[#E06666]/40 hover:text-[#E06666] dark:hover:bg-slate-700"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(patient.id)}
                          className="rounded-lg border border-border-main p-1.5 text-text-dim transition hover:border-red-300 hover:text-red-600 dark:hover:bg-slate-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-border-main bg-bg-surface p-6 shadow-2xl dark:bg-slate-900">
            <h3 className="text-base font-bold text-text-main">{t("admin.confirmDelete")}</h3>
            <p className="mt-2 text-sm text-text-dim">{t("admin.deletePatientConfirmation")}</p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-xl border border-border-main py-2.5 text-sm font-semibold text-text-main transition hover:bg-bg-app"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
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