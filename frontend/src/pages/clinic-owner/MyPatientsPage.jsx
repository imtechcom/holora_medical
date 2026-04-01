import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getPatientsByOwnerBranchesApi } from "../../services/patientService";

const genderLabel = (gender, t) => {
  if (gender === "male") return t("admin.genderMale") || "Male";
  if (gender === "female") return t("admin.genderFemale") || "Female";
  if (gender === "other") return t("admin.genderOther") || "Other";
  return "—";
};

const MyPatientsPage = () => {
  const { t } = useTranslation();

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getPatientsByOwnerBranchesApi();
      setPatients(res.data || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          t("clinicOwner.errorLoadingPatients") ||
          "Failed to load patients"
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filtered = patients.filter((p) => {
    const kw = searchTerm.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(kw) ||
      p.phone?.toLowerCase().includes(kw) ||
      p.email?.toLowerCase().includes(kw) ||
      p.patient_code?.toLowerCase().includes(kw) ||
      p.branch_names?.toLowerCase().includes(kw)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-main">
            {t("clinicOwner.myPatients") || "My Patients"}
          </h1>
          <p className="text-text-dim text-sm mt-1">
            {t("clinicOwner.myPatientsSubtitle") ||
              "Patients registered across all your branches"}
          </p>
        </div>
        <div className="text-sm text-text-dim">
          {!loading && (
            <span>
              {filtered.length}{" "}
              {t("clinicOwner.patientsCount") || "patient(s)"}
            </span>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={
            t("clinicOwner.searchPatients") ||
            "Search by name, phone, email, code or branch..."
          }
          className="w-full max-w-md border border-border-main bg-bg-surface dark:bg-slate-800 text-text-main rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E06666] placeholder-text-dim"
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#E06666]"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-bg-surface dark:bg-slate-800 rounded-xl shadow-sm border border-border-main p-12 text-center">
          <div className="text-5xl mb-4">🧑‍⚕️</div>
          <h3 className="text-lg font-semibold text-text-main mb-2">
            {searchTerm
              ? t("admin.noPatientsFound") || "No patients match your search"
              : t("clinicOwner.noPatients") || "No patients yet"}
          </h3>
          {!searchTerm && (
            <p className="text-text-dim text-sm">
              {t("clinicOwner.noPatientsHint") ||
                "Patients will appear here once they register at your branches."}
            </p>
          )}
        </div>
      ) : (
        <div className="bg-bg-surface dark:bg-slate-800 rounded-xl shadow-sm border border-border-main overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-bg-app dark:bg-slate-900 border-b border-border-main">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-dim">
                  {t("admin.patientCode") || "Code"}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-dim">
                  {t("admin.fullName") || "Patient"}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-dim">
                  {t("admin.phone") || "Phone"}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-dim">
                  {t("admin.gender") || "Gender"}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-dim">
                  {t("branch.managementTitle") || "Branches"}
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-text-dim">
                  {t("common.status") || "Status"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {filtered.map((patient) => (
                <tr
                  key={patient.id}
                  className="hover:bg-bg-app dark:hover:bg-slate-700/50 transition"
                >
                  <td className="px-4 py-3 text-xs text-text-dim font-mono">
                    {patient.patient_code}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-main">
                      {patient.full_name}
                    </div>
                    {patient.email && (
                      <div className="text-xs text-text-dim">{patient.email}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-dim">
                    {patient.phone || "—"}
                  </td>
                  <td className="px-4 py-3 text-text-dim">
                    {genderLabel(patient.gender, t)}
                  </td>
                  <td className="px-4 py-3 text-text-dim text-xs">
                    {patient.branch_names || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                        patient.status === "active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                          : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {patient.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyPatientsPage;
