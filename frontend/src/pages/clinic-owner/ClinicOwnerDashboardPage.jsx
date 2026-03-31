import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import branchService from "../../services/branchService";
import { getDoctorsByOwnerBranchesApi } from "../../services/doctorService";
import subscriptionService from "../../services/subscriptionService";

const ClinicOwnerDashboardPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [branchCount, setBranchCount] = useState(null);
  const [doctorCount, setDoctorCount] = useState(null);
  const [subscriptionSummary, setSubscriptionSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [branchRes, doctorRes] = await Promise.all([
          branchService.getMyBranches(),
          getDoctorsByOwnerBranchesApi(),
        ]);
        const subscriptionRes = await subscriptionService.getMySubscriptions();
        if (!cancelled) {
          setBranchCount((branchRes.data || []).length);
          setDoctorCount((doctorRes.data || []).length);
          setSubscriptionSummary((subscriptionRes.data || [])[0] || null);
        }
      } catch {
        if (!cancelled) {
          setBranchCount(0);
          setDoctorCount(0);
          setSubscriptionSummary(null);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t("clinicOwner.welcomeTitle") || "Welcome back"}, {user?.full_name || "Provider"}!
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {t("clinicOwner.welcomeSubtitle") || "Manage your branches and doctors from here."}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">🏥</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {t("clinicOwner.totalBranches") || "Branches"}
            </span>
          </div>
          <p className="text-4xl font-bold text-[#E06666]">
            {branchCount === null ? "—" : branchCount}
          </p>
          <Link
            to="/clinic-owner/branches"
            className="mt-3 inline-block text-sm text-[#E06666] hover:underline"
          >
            {t("clinicOwner.viewBranches") || "View all branches →"}
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">👨‍⚕️</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {t("clinicOwner.totalDoctors") || "Doctors"}
            </span>
          </div>
          <p className="text-4xl font-bold text-[#E06666]">
            {doctorCount === null ? "—" : doctorCount}
          </p>
          <Link
            to="/clinic-owner/doctors"
            className="mt-3 inline-block text-sm text-[#E06666] hover:underline"
          >
            {t("clinicOwner.viewDoctors") || "View all doctors →"}
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl">💳</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {t("clinicOwner.subscription") || "Subscription"}
            </span>
          </div>
          <p className="text-lg font-bold text-[#E06666] capitalize">
            {subscriptionSummary?.status || "none"}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {subscriptionSummary?.plan_name || "No active plan yet"}
          </p>
          <Link
            to="/clinic-owner/subscription"
            className="mt-3 inline-block text-sm text-[#E06666] hover:underline"
          >
            Manage subscription →
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-base font-semibold text-gray-800 mb-4">
          {t("clinicOwner.quickActions") || "Quick Actions"}
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/clinic-owner/branches/new"
            className="bg-[#E06666] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#D55555] transition shadow-sm"
          >
            + {t("branch.addTitle") || "Add Branch"}
          </Link>
          <Link
            to="/clinic-owner/doctors/new"
            className="border border-[#E06666] text-[#E06666] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#FFF5F5] transition"
          >
            + {t("admin.addNewDoctor") || "Add Doctor"}
          </Link>
          <Link
            to="/clinic-owner/subscription"
            className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
          >
            {t("clinicOwner.subscription") || "Subscription"}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ClinicOwnerDashboardPage;
