import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Calendar,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  FileText,
} from "lucide-react";
import { getMyDoctorPatientsApi } from "../services/doctorService";

const formatDate = (dateStr, locale) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "-";
  }
};

const DoctorPatientsPage = () => {
  const { t, i18n } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getMyDoctorPatientsApi();
      setPatients(res.data || []);
    } catch (err) {
      console.error("Failed to fetch patients:", err);
      setError(err.response?.data?.message || err.message || t("doctor.patientsPage.errors.loadFailed"));
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const kw = searchTerm.toLowerCase();
      return (
        p.full_name?.toLowerCase().includes(kw) ||
        p.phone?.toLowerCase().includes(kw) ||
        p.email?.toLowerCase().includes(kw) ||
        p.patient_code?.toLowerCase().includes(kw)
      );
    });
  }, [patients, searchTerm]);

  const stats = useMemo(() => {
    return {
      total: patients.length,
      activeThisMonth: patients.filter(
        (p) =>
          p.last_appointment_date &&
          new Date(p.last_appointment_date).getMonth() === new Date().getMonth()
      ).length,
      withAppointments: patients.filter((p) => p.appointment_count > 0).length,
      withConsultations: patients.filter((p) => p.consultation_count > 0).length,
    };
  }, [patients]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Hero Section */}
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#3B82F6] to-[#1E40AF] p-8 text-white shadow-lg md:p-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/75">{t("doctor.zone")}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              {t("doctor.patientsPage.title")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 md:text-base">
              {t("doctor.patientsPage.heroDescription")}
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
              <Sparkles className="h-4 w-4" />
              {t("doctor.patientsPage.summaryTitle")}
            </div>
            <p className="mt-2 text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-white/75">{t("doctor.patientsPage.totalLabel")}</p>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-dim">{t("doctor.patientsPage.stats.total")}</p>
            <Users className="h-5 w-5 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-text-main">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-dim">{t("doctor.patientsPage.stats.activeThisMonth")}</p>
            <Calendar className="h-5 w-5 text-green-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-text-main">{stats.activeThisMonth}</p>
        </div>
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-dim">{t("doctor.patientsPage.stats.appointments")}</p>
            <FileText className="h-5 w-5 text-purple-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-text-main">{stats.withAppointments}</p>
        </div>
        <div className="rounded-2xl border border-border-main bg-bg-surface p-5 shadow-sm dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-dim">{t("doctor.patientsPage.stats.consultations")}</p>
            <FileText className="h-5 w-5 text-orange-500" />
          </div>
          <p className="mt-2 text-3xl font-bold text-text-main">{stats.withConsultations}</p>
        </div>
      </section>

      {/* Patients Table */}
      <section className="rounded-2xl border border-border-main bg-bg-surface shadow-sm dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-main px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-text-main">{t("doctor.patientsPage.listTitle")}</h2>
            <p className="text-sm text-text-dim">{t("doctor.patientsPage.listDescription")}</p>
          </div>
          <button
            onClick={fetchPatients}
            className="inline-flex items-center gap-2 rounded-lg border border-border-main px-3 py-2 text-sm font-semibold text-text-main transition hover:bg-bg-app"
          >
            <RefreshCw className="h-4 w-4" />
            {t("common.refresh")}
          </button>
        </div>

        {error ? (
          <div className="mx-5 mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : null}

        {/* Search Bar */}
        <div className="border-b border-border-main px-5 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-dim" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("doctor.patientsPage.searchPlaceholder")}
              className="w-full rounded-lg border border-border-main bg-bg-app p-3 pl-10 text-sm text-text-main outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#BFDBFE] dark:bg-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto px-2 pb-2 md:px-5 md:pb-5">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-text-dim">
                <th className="px-3 py-4">{t("doctor.patientsPage.columns.code")}</th>
                <th className="px-3 py-4">{t("doctor.patientsPage.columns.name")}</th>
                <th className="px-3 py-4">{t("doctor.patientsPage.columns.contact")}</th>
                <th className="px-3 py-4">{t("doctor.patientsPage.columns.visits")}</th>
                <th className="px-3 py-4">{t("doctor.patientsPage.columns.lastVisit")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("doctor.patientsPage.loading")}
                    </span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-3 py-10 text-center text-sm text-text-dim">
                    {searchTerm
                      ? t("doctor.patientsPage.emptySearch")
                      : t("doctor.patientsPage.emptyAll")}
                  </td>
                </tr>
              ) : (
                filtered.map((patient) => (
                  <tr key={patient.id} className="border-t border-border-main/70 text-sm">
                    <td className="px-3 py-4">
                      <p className="font-semibold text-text-main">{patient.patient_code}</p>
                    </td>
                    <td className="px-3 py-4">
                      <p className="font-semibold text-text-main">{patient.full_name}</p>
                      {patient.gender && (
                        <p className="text-xs text-text-dim">
                          {patient.gender === "male"
                            ? t("admin.genderMale")
                            : patient.gender === "female"
                            ? t("admin.genderFemale")
                            : t("admin.genderOther")}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-text-main">{patient.phone || "-"}</p>
                      {patient.email && (
                        <p className="text-xs text-text-dim">{patient.email}</p>
                      )}
                    </td>
                    <td className="px-3 py-4">
                      <div className="space-y-1">
                        <p className="text-text-main">
                          <span className="font-semibold">{patient.appointment_count}</span>{" "}
                          {t("doctor.patientsPage.appointmentShort")}
                        </p>
                        <p className="text-text-dim">
                          <span className="font-semibold">{patient.consultation_count}</span>{" "}
                          {t("doctor.patientsPage.consultationShort")}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <p className="text-text-main">
                        {patient.last_appointment_date
                          ? formatDate(patient.last_appointment_date, i18n.language)
                          : "-"}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default DoctorPatientsPage;
