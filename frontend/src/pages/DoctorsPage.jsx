import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BriefcaseMedical, Building2, Search, Stethoscope, UserRound } from "lucide-react";
import { getAllDoctorsApi } from "../services/doctorService";

const normalizeText = (value) =>
  (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const DoctorsPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDoctors = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await getAllDoctorsApi();
        const list = asArray(response).filter((item) => item.status !== "deleted" && item.status !== "blocked");
        setDoctors(list);
      } catch (err) {
        console.error("Failed to load doctors", err);
        setError("Khong the tai danh sach bac si. Vui long thu lai.");
      } finally {
        setIsLoading(false);
      }
    };

    loadDoctors();
  }, []);

  const specialties = useMemo(() => {
    const unique = Array.from(new Set(doctors.map((d) => d.specialty_name).filter(Boolean)));
    return unique.sort((a, b) => a.localeCompare(b, "vi"));
  }, [doctors]);

  const visibleDoctors = useMemo(() => {
    const query = normalizeText(searchText);
    return doctors.filter((doctor) => {
      if (specialtyFilter && doctor.specialty_name !== specialtyFilter) return false;
      if (!query) return true;

      const haystack = [
        doctor.full_name,
        doctor.specialty_name,
        doctor.branch_names,
        doctor.qualification,
      ]
        .map(normalizeText)
        .join(" ");

      return haystack.includes(query);
    });
  }, [doctors, searchText, specialtyFilter]);

  return (
    <div className="relative min-h-[calc(100vh-140px)] overflow-hidden bg-[#F7F9FC] text-gray-900 dark:bg-[#0F141F] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-220px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#E06666]/10 blur-3xl dark:bg-[#E06666]/10" />
        <div className="absolute bottom-[-100px] left-[-120px] h-[260px] w-[260px] rounded-full bg-[#BFD8FF]/25 blur-3xl dark:bg-[#24324A]/35" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-[#10325A] via-[#14497F] to-[#0D5D8A] px-6 py-8 text-white shadow-[0_22px_45px_rgba(15,50,90,0.28)] sm:px-8">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]">
            <Stethoscope size={14} />
            Doctor Directory
          </p>
          <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">Tim bac si phu hop voi nhu cau cua ban</h1>
          <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
            Loc theo chuyen khoa, tim theo ten bac si hoac chi nhanh de dat lich nhanh hon.
          </p>

          <div className="mt-6 rounded-2xl border border-white/20 bg-white p-3 text-gray-900 shadow-lg backdrop-blur">
            <div className="grid gap-2 md:grid-cols-[1.5fr_1fr]">
              <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                <Search size={16} className="text-gray-500" />
                <input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Tim theo ten, chuyen khoa, chi nhanh..."
                  className="w-full border-none bg-transparent text-sm focus:outline-none"
                />
              </label>

              <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
                <BriefcaseMedical size={16} className="text-gray-500" />
                <select
                  value={specialtyFilter}
                  onChange={(e) => setSpecialtyFilter(e.target.value)}
                  className="w-full border-none bg-transparent text-sm focus:outline-none"
                >
                  <option value="">Tat ca chuyen khoa</option>
                  {specialties.map((specialty) => (
                    <option key={specialty} value={specialty}>
                      {specialty}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="animate-pulse rounded-2xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-[#141B29]">
                  <div className="h-5 w-1/2 rounded bg-gray-200 dark:bg-slate-700" />
                  <div className="mt-4 h-4 w-3/4 rounded bg-gray-100 dark:bg-slate-800" />
                  <div className="mt-2 h-4 w-2/3 rounded bg-gray-100 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-200">
              {error}
            </div>
          ) : visibleDoctors.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-[#141B29]">
              <h2 className="text-lg font-semibold">Khong tim thay bac si phu hop</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">Thu doi bo loc hoac tu khoa tim kiem.</p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-gray-600 dark:text-slate-400">
                Co <span className="font-semibold text-gray-900 dark:text-slate-100">{visibleDoctors.length}</span> bac si phu hop
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleDoctors.map((doctor) => (
                  <article
                    key={doctor.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-[#E06666]/35 hover:shadow-lg dark:border-slate-700 dark:bg-[#141B29]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EAF4FF] text-[#2B6298] dark:bg-[#1D2C43] dark:text-[#9BC0EB]">
                        <UserRound size={20} />
                      </div>
                      <div>
                        <h3 className="line-clamp-1 text-lg font-semibold text-gray-900 dark:text-slate-100">{doctor.full_name || "Doctor"}</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{doctor.specialty_name || "General"}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-slate-300">
                      <p className="inline-flex items-center gap-2 rounded-full bg-[#FFF3F2] px-2.5 py-1 text-xs font-semibold text-[#BC4D4D] dark:bg-[#2B1F28] dark:text-[#F3A3A3]">
                        <Building2 size={13} />
                        {doctor.branch_names || "Dang cap nhat chi nhanh"}
                      </p>
                      {doctor.experience_years ? <p>Kinh nghiem: {doctor.experience_years} nam</p> : null}
                      {doctor.qualification ? <p className="line-clamp-2">Bang cap: {doctor.qualification}</p> : null}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#B64949]">
                        {doctor.consultation_fee ? `${Number(doctor.consultation_fee).toLocaleString("vi-VN")} VND` : "Lien he"}
                      </span>
                      <Link
                        to={`/doctors/${doctor.id}`}
                        className="inline-flex items-center rounded-xl border border-[#E06666]/30 bg-[#FFF5F5] px-3 py-2 text-sm font-semibold text-[#B64949] transition hover:bg-[#FFECEB]"
                      >
                        Xem ho so
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorsPage;
