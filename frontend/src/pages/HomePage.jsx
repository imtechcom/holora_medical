import React from "react";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Dat lich theo chi nhanh",
    desc: "Chon dung co so kham phu hop va dat lich ngay trong vai buoc.",
    icon: "🏥",
  },
  {
    title: "Bac si da khoa, da co so",
    desc: "Mot bac si co the phu trach nhieu chi nhanh, de dang linh hoat lich kham.",
    icon: "👨‍⚕️",
  },
  {
    title: "Tu van nhanh",
    desc: "Gui yeu cau tu van online va theo doi ket qua ngay tren he thong.",
    icon: "💬",
  },
];

const HomePage = () => {
  return (
    <div className="bg-[#F8FAFC] text-gray-800">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,#99F6E4_0%,transparent_35%),radial-gradient(circle_at_90%_20%,#BFDBFE_0%,transparent_35%),linear-gradient(120deg,#0F172A_0%,#0F766E_45%,#1D4ED8_100%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 text-white">
          <div className="max-w-3xl">
            <p className="mb-4 inline-block rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
              Holora Medical Platform
            </p>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              Dat lich kham nhanh,
              <br />
              dung bac si, dung chi nhanh.
            </h1>
            <p className="mt-6 max-w-2xl text-base text-blue-50 md:text-lg">
              Nen tang cham soc suc khoe thong minh: dat lich theo khung gio trong, theo doi lich cua toi,
              ket hop tu van truc tuyen va ho so y te tren cung mot he thong.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/appointments"
                className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-50"
              >
                Dat lich hen ngay
              </Link>
              <Link
                to="/patient/consultations/new"
                className="rounded-xl border border-white/60 bg-transparent px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Gui yeu cau tu van
              </Link>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-wide text-blue-100">Co so</div>
              <div className="mt-1 text-2xl font-black">Nhieu chi nhanh</div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-wide text-blue-100">Dat lich</div>
              <div className="mt-1 text-2xl font-black">Theo slot trong</div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <div className="text-xs uppercase tracking-wide text-blue-100">Theo doi</div>
              <div className="mt-1 text-2xl font-black">Lich cua toi</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="text-3xl font-black text-gray-900">Trai nghiem kham benh hien dai</h2>
        <p className="mt-2 text-gray-600">Toi uu cho benh nhan can dat lich nhanh va ro rang thong tin.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {features.map((item) => (
            <article key={item.title} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="text-3xl">{item.icon}</div>
              <h3 className="mt-3 text-lg font-bold text-gray-900">{item.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-6 py-10 md:flex-row md:items-center">
          <div>
            <h3 className="text-2xl font-black text-gray-900">Can dat lich ngay hom nay?</h3>
            <p className="mt-1 text-gray-600">Bat dau tu viec chon bac si va chi nhanh phu hop.</p>
          </div>
          <Link
            to="/appointments"
            className="rounded-xl bg-[#0F766E] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0D9488]"
          >
            Mo trang dat lich
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
