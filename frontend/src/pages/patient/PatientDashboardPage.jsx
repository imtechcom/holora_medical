import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import { 
  Calendar, 
  Stethoscope, 
  MapPin, 
  Users, 
  ArrowRight, 
  Bot, 
  UserCircle2,
} from "lucide-react";
import { getPatientStatsApi } from "../../services/patientService";

const Hospital = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PatientDashboardPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    pastConsultations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await getPatientStatsApi();
        if (res.data) setStats(res.data);
        setError("");
      } catch (err) {
        setError(err?.response?.data?.message || err.message || t("patient.dashboardPage.loadError"));
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [t]);

  const quickLinks = [
    {
      icon: <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: t("patient.myAppointments"),
      description: t("patient.upcomingAppointments"),
      count: stats.upcomingAppointments,
      link: "/patient/appointments",
      lightBg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      icon: <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6" />,
      title: t("patient.myConsultations"),
      description: t("patient.pastConsultations"),
      count: stats.pastConsultations,
      link: "/patient/consultations",
      lightBg: "bg-green-50 dark:bg-green-900/20",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#E06666]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 p-5 rounded-2xl">
          <h2 className="text-base font-bold text-red-800 dark:text-red-300 mb-1">
            {t("patient.dashboardPage.errorTitle")}
          </h2>
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-8">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#E06666] to-[#C04444] rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 tracking-tight leading-tight">
            {t("common.welcome")}, {user?.full_name}!
          </h1>
          <p className="text-white/90 text-sm sm:text-lg md:text-xl leading-relaxed mb-5 sm:mb-8">
            {t("patient.welcomeMessage")}
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Link
              to="/patient/appointments"
              className="bg-white text-[#E06666] px-5 py-2.5 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-md flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              {t("patient.myAppointments")}
            </Link>
            <Link
              to="/patient/holoramind"
              className="bg-black/20 backdrop-blur-md border border-white/30 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-black/30 transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
              {t("patient.aiAssistant")}
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 sm:w-64 sm:h-64 bg-black/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Stats and Discovery Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {quickLinks.map((item, idx) => (
            <Link
              key={idx}
              to={item.link}
              className="group bg-bg-surface dark:bg-slate-800 p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-border-main dark:border-slate-700 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl ${item.lightBg}`}>
                  {React.cloneElement(item.icon, { className: "w-5 h-5 sm:w-6 sm:h-6 text-text-main" })}
                </div>
                <span className="text-2xl sm:text-3xl font-black text-text-main group-hover:scale-110 transition-transform">
                  {item.count}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-text-main mb-1">{item.title}</h3>
              <p className="text-xs sm:text-sm text-text-dim mb-3 sm:mb-4">{item.description}</p>
              <div className="flex items-center gap-1 text-sm font-semibold text-[#E06666] group-hover:gap-2 transition-all">
                {t("common.details")} <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Discovery */}
        <div className="bg-bg-surface dark:bg-slate-800 p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-border-main dark:border-slate-700">
          <h3 className="text-base sm:text-lg font-bold text-text-main mb-4 sm:mb-6 flex items-center gap-2">
            <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-[#E06666]" />
            {t("patient.discovery")}
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <Link
              to="/patient/branches"
              className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-bg-app dark:hover:bg-slate-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
                  <Hospital className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-sm sm:text-base font-semibold text-text-main">{t("patient.browseBranches")}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-text-dim group-hover:text-text-main shrink-0" />
            </Link>
            <Link
              to="/patient/doctors"
              className="flex items-center justify-between p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-bg-app dark:hover:bg-slate-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-sm sm:text-base font-semibold text-text-main">{t("patient.browseDoctors")}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-text-dim group-hover:text-text-main shrink-0" />
            </Link>
          </div>
        </div>
      </div>

      {/* AI + Profile Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* HoloraMind Card */}
        <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white relative overflow-hidden group">
          <div className="relative z-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#E06666] rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 shadow-lg shadow-[#E06666]/30">
              <Bot className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-base sm:text-xl font-bold mb-1 sm:mb-2">{t("patient.aiAssistant")}</h3>
            <p className="text-slate-400 text-sm sm:text-base mb-4 sm:mb-6 max-w-xs">{t("patient.aiAssistantDescription")}</p>
            <Link
              to="/patient/holoramind"
              className="inline-flex items-center gap-2 text-[#E06666] font-bold hover:text-white transition-colors text-sm sm:text-base"
            >
              {t("patient.startChat")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <Bot className="absolute bottom-[-20px] right-[-20px] w-32 h-32 sm:w-48 sm:h-48 text-white/5 group-hover:translate-x-[-10px] group-hover:translate-y-[-10px] transition-transform duration-700 pointer-events-none" />
        </div>

        {/* Profile Card */}
        <div className="bg-bg-surface dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-border-main dark:border-slate-700 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6 text-indigo-600">
              <UserCircle2 className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <h3 className="text-base sm:text-xl font-bold text-text-main mb-1 sm:mb-2">{t("patient.completeProfile")}</h3>
            <p className="text-text-dim text-sm sm:text-base mb-4 sm:mb-6">{t("patient.completeProfileDesc")}</p>
          </div>
          <Link
            to="/patient/profile"
            className="w-full py-2.5 sm:py-3 bg-bg-app dark:bg-slate-700 text-center rounded-xl font-bold text-text-main hover:bg-[#E06666] hover:text-white transition-all shadow-sm text-sm sm:text-base"
          >
            {t("common.editProfile")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboardPage;
