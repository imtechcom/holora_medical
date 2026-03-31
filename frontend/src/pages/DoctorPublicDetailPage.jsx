import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BriefcaseMedical, Building2, Clock3, Phone, UserRound } from "lucide-react";
import { getDoctorByIdApi } from "../services/doctorService";

const unwrap = (payload) => payload?.data || payload;

const DoctorPublicDetailPage = () => {
  const { id } = useParams();
  const [doctor, setDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDoctor = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await getDoctorByIdApi(id);
        setDoctor(unwrap(response));
      } catch (err) {
        console.error("Failed to load doctor detail", err);
        setError("Khong the tai ho so bac si. Vui long thu lai.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctor();
  }, [id]);

  return (
    <div className="relative min-h-[calc(100vh-140px)] overflow-hidden bg-[#F7F9FC] text-gray-900 dark:bg-[#0F141F] dark:text-slate-100">
      <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to="/doctors"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-[#E06666]/35 hover:text-[#B64949] dark:border-slate-700 dark:bg-[#141B29] dark:text-slate-200"
        >
          <ArrowLeft size={16} />
          Quay lai danh sach bac si
        </Link>

        {isLoading ? (
          <div className="mt-6 animate-pulse rounded-2xl border border-gray-200 bg-white p-6 dark:border-slate-700 dark:bg-[#141B29]">
            <div className="h-7 w-2/3 rounded bg-gray-200 dark:bg-slate-700" />
            <div className="mt-4 h-4 w-1/2 rounded bg-gray-100 dark:bg-slate-800" />
            <div className="mt-3 h-4 w-3/4 rounded bg-gray-100 dark:bg-slate-800" />
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : !doctor ? (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600 dark:border-slate-700 dark:bg-[#141B29] dark:text-slate-300">
            Khong tim thay ho so bac si.
          </div>
        ) : (
          <article className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#141B29]">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF4FF] text-[#2B6298] dark:bg-[#1D2C43] dark:text-[#9BC0EB]">
                <UserRound size={24} />
              </div>
              <div>
                <h1 className="text-2xl font-semibold sm:text-3xl">{doctor.full_name || "Doctor"}</h1>
                <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Ma bac si: {doctor.doctor_code || "N/A"}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 text-sm text-gray-700 dark:text-slate-300 sm:grid-cols-2">
              <p className="inline-flex items-center gap-2 rounded-xl bg-[#FFF3F2] px-3 py-2 dark:bg-[#2B1F28]">
                <BriefcaseMedical size={15} className="text-[#B64949]" />
                Chuyen khoa: {doctor.specialty_name || "Dang cap nhat"}
              </p>
              <p className="inline-flex items-center gap-2 rounded-xl bg-[#EEF5FF] px-3 py-2 dark:bg-[#1D2C43]">
                <Building2 size={15} className="text-[#2B6298]" />
                Chi nhanh: {doctor.branch_names || "Dang cap nhat"}
              </p>
              <p className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 dark:bg-[#111827]">
                <Clock3 size={15} className="text-gray-600 dark:text-slate-300" />
                Kinh nghiem: {doctor.experience_years ? `${doctor.experience_years} nam` : "Dang cap nhat"}
              </p>
              <p className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 dark:bg-[#111827]">
                <Phone size={15} className="text-gray-600 dark:text-slate-300" />
                Lien he: {doctor.phone || "Dang cap nhat"}
              </p>
            </div>

            {doctor.qualification && (
              <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm leading-7 text-gray-700 dark:bg-[#111827] dark:text-slate-300">
                <p className="font-semibold">Bang cap / Chung chi</p>
                <p className="mt-1">{doctor.qualification}</p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/appointments"
                className="inline-flex items-center rounded-xl bg-[#E06666] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#D55555]"
              >
                Dat lich voi bac si nay
              </Link>
              <Link
                to="/doctors"
                className="inline-flex items-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-[#E06666]/35 hover:text-[#B64949] dark:border-slate-700 dark:bg-[#141B29] dark:text-slate-200"
              >
                Xem bac si khac
              </Link>
            </div>
          </article>
        )}
      </div>
    </div>
  );
};

export default DoctorPublicDetailPage;
