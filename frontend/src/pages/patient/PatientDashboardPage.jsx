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
  Clock,
  CheckCircle2
} from "lucide-react";
import { getPatientStatsApi } from "../../services/patientService";

const PatientDashboardPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    pastConsultations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await getPatientStatsApi();
        if (res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const quickLinks = [
    {
      icon: <Calendar className="w-6 h-6" />,
      title: t("patient.myAppointments"),
      description: t("patient.upcomingAppointments"),
      count: stats.upcomingAppointments,
      link: "/patient/appointments",
      color: "from-blue-500 to-blue-600",
      lightBg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      icon: <Stethoscope className="w-6 h-6" />,
      title: t("patient.myConsultations"),
      description: t("patient.pastConsultations"),
      count: stats.pastConsultations,
      link: "/patient/consultations",
      color: "from-green-500 to-emerald-600",
      lightBg: "bg-green-50 dark:bg-green-900/20",
    },
  ];

  if (loading) {
     return (
       <div className="flex items-center justify-center min-h-[400px]">
         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E06666]"></div>
       </div>
     );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#E06666] to-[#C04444] rounded-3xl shadow-lg p-8 md:p-12 text-white">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
            {t("common.welcome")}, {user?.full_name}!
          </h1>
          <p className="text-white/90 text-lg md:text-xl leading-relaxed mb-8">
            {t("patient.welcomeMessage")}
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/patient/appointments"
              className="bg-white text-[#E06666] px-6 py-3 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-md flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              {t("patient.myAppointments")}
            </Link>
            <Link
              to="/patient/holoramind"
              className="bg-black/20 backdrop-blur-md border border-white/30 text-white px-6 py-3 rounded-xl font-bold hover:bg-black/30 transition-all flex items-center gap-2"
            >
              <Bot className="w-5 h-5" />
              {t("patient.aiAssistant")}
            </Link>
          </div>
        </div>
        
        {/* Abstract shapes for design */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
      </div>

      {/* Stats and Discovery Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickLinks.map((item, idx) => (
            <Link 
              key={idx} 
              to={item.link}
              className="group bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${item.lightBg}`}>
                   {React.cloneElement(item.icon, { className: `w-6 h-6 text-text-main` })}
                </div>
                <span className="text-3xl font-black text-text-main group-hover:scale-110 transition-transform">
                  {item.count}
                </span>
              </div>
              <h3 className="text-lg font-bold text-text-main mb-1">{item.title}</h3>
              <p className="text-sm text-text-dim mb-4">{item.description}</p>
              <div className="flex items-center text-sm font-semibold text-[#E06666] group-hover:gap-2 transition-all">
                {t("common.details") || "View Details"} <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Discovery Area */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
           <h3 className="text-lg font-bold text-text-main mb-6 flex items-center gap-2">
             <MapPin className="w-5 h-5 text-[#E06666]" />
             {t("patient.discovery")}
           </h3>
           <div className="space-y-3">
             <Link 
               to="/patient/branches"
               className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-750 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group"
             >
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                   <Hospital className="w-5 h-5" />
                 </div>
                 <span className="font-semibold text-text-main">{t("patient.browseBranches")}</span>
               </div>
               <ArrowRight className="w-4 h-4 text-text-dim group-hover:text-text-main" />
             </Link>

             <Link 
               to="/patient/doctors"
               className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-750 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group"
             >
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
                   <Users className="w-5 h-5" />
                 </div>
                 <span className="font-semibold text-text-main">{t("patient.browseDoctors")}</span>
               </div>
               <ArrowRight className="w-4 h-4 text-text-dim group-hover:text-text-main" />
             </Link>
           </div>
        </div>
      </div>

      {/* AI Promition and Profile Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* HoloraMind Card */}
         <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-[#E06666] rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-[#E06666]/30">
                <Bot className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold mb-2">{t("patient.aiAssistant")}</h3>
              <p className="text-slate-400 mb-6 max-w-xs">{t("patient.aiAssistantDescription")}</p>
              <Link 
                to="/patient/holoramind"
                className="inline-flex items-center gap-2 text-[#E06666] font-bold hover:text-white transition-colors"
              >
                {t("patient.startChat")} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {/* Background Robot Decoration */}
            <Bot className="absolute bottom-[-20px] right-[-20px] w-48 h-48 text-white/5 group-hover:translate-x-[-10px] group-hover:translate-y-[-10px] transition-transform duration-700" />
         </div>

         {/* Profile Management Card */}
         <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-gray-100 dark:border-slate-700 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 text-indigo-600">
                <UserCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-text-main mb-2">{t("patient.completeProfile")}</h3>
              <p className="text-text-dim mb-6">{t("patient.completeProfileDesc")}</p>
            </div>
            <Link 
              to="/patient/profile"
              className="w-full py-3 bg-gray-100 dark:bg-slate-700 text-center rounded-xl font-bold text-text-main hover:bg-[#E06666] hover:text-white transition-all shadow-sm"
            >
              {t("common.editProfile") || "Go to Profile"}
            </Link>
         </div>
      </div>
    </div>
  );
};

// Internal icon component for cleaner code
const Hospital = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

export default PatientDashboardPage;
