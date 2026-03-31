import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const HomePage = () => {
  const { t, i18n } = useTranslation();

  const features = [
    {
      icon: "🏥",
      titleEn: "Book by Branch",
      titleVi: "Đặt lịch theo chi nhánh",
      descEn: "Select your preferred healthcare facility and book an appointment in just a few steps.",
      descVi: "Chọn đúng cơ sở khám phù hợp và đặt lịch ngay trong vài bước.",
    },
    {
      icon: "👨‍⚕️",
      titleEn: "Multi-Branch Doctors",
      titleVi: "Bác sĩ đa khoa, đa cơ sở",
      descEn: "One doctor manages multiple branches for flexible and easy schedule management.",
      descVi: "Một bác sĩ có thể phụ trách nhiều chi nhánh, dễ dàng linh hoạt lịch khám.",
    },
    {
      icon: "💬",
      titleEn: "Quick Consultation",
      titleVi: "Tư vấn nhanh",
      descEn: "Submit online consultation requests and track results directly on our system.",
      descVi: "Gửi yêu cầu tư vấn online và theo dõi kết quả ngay trên hệ thống.",
    },
  ];

  const stats = [
    { label: "Cơ sở / Branches", value: "Nhiều chi nhánh" },
    { label: "Đặt lịch / Booking", value: "Theo slot trong" },
    { label: "Theo dõi / Tracking", value: "Lịch của tôi" },
  ];

  return (
    <div className="bg-white text-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#E06666] via-[#D55555] to-[#C94545] py-24 md:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full blur-3xl" />
        </div>
        
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="max-w-2xl">
            <div className="mb-6 inline-block">
              <span className="inline-block rounded-full border-2 border-white/40 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm">
                ✨ Holora Medical Platform
              </span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
              {i18n.language === "vi" 
                ? "Đặt lịch kham nhanh,\nđúng bác sĩ, đúng chi nhánh"
                : "Quick Appointments,\nRight Doctor, Right Branch"
              }
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-xl leading-relaxed">
              {i18n.language === "vi"
                ? "Nền tảng chăm sóc sức khỏe thông minh: đặt lịch theo khung giờ trống, theo dõi lịch của tôi, kết hợp tư vấn trực tuyến và hồ sơ y tế trên cùng một hệ thống."
                : "Intelligent healthcare platform: book appointments by available slots, track your schedule, combine online consultations and medical records all in one system."
              }
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/appointments"
                className="inline-flex items-center justify-center rounded-xl bg-white text-[#E06666] px-8 py-4 font-bold shadow-xl hover:shadow-2xl transition transform hover:scale-105"
              >
                {i18n.language === "vi" ? "📅 Đặt lịch hẹn ngay" : "📅 Book Now"}
              </Link>
              <Link
                to="/patient/consultations/new"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white text-white px-8 py-4 font-bold hover:bg-white/10 transition"
              >
                {i18n.language === "vi" ? "💬 Gửi yêu cầu tư vấn" : "💬 Request Consultation"}
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, idx) => (
              <div key={idx} className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-6 text-white">
                <div className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-2">
                  {i18n.language === "vi" ? stat.label.split(" / ")[1] : stat.label.split(" / ")[0]}
                </div>
                <div className="text-2xl font-black">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black text-gray-900 mb-4">
            {i18n.language === "vi" ? "Trải nghiệm khám bệnh hiện đại" : "Modern Healthcare Experience"}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {i18n.language === "vi"
              ? "Tối ưu cho bệnh nhân cần đặt lịch nhanh và rõ ràng thông tin"
              : "Optimized for patients who need quick booking and clear information"
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <article 
              key={idx} 
              className="group rounded-2xl border-2 border-gray-200 bg-white p-8 shadow-md hover:shadow-xl hover:border-[#E06666] transition transform hover:-translate-y-2"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#E06666] transition">
                {i18n.language === "vi" ? feature.titleVi : feature.titleEn}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {i18n.language === "vi" ? feature.descVi : feature.descEn}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-[#F5E6E6] to-[#FFE8E8] border-t-4 border-[#E06666]">
        <div className="mx-auto max-w-7xl px-6 py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="text-3xl font-black text-gray-900 mb-3">
              {i18n.language === "vi" ? "Bắt đầu hôm nay!" : "Get Started Today!"}
            </h3>
            <p className="text-gray-700 text-lg">
              {i18n.language === "vi"
                ? "Bắt đầu từ việc chọn bác sĩ và chi nhánh phù hợp"
                : "Start by choosing the right doctor and branch for you"
              }
            </p>
          </div>
          <Link
            to="/appointments"
            className="flex-shrink-0 rounded-xl bg-[#E06666] text-white px-10 py-4 font-bold shadow-lg hover:bg-[#D55555] transition transform hover:scale-105"
          >
            {i18n.language === "vi" ? "Mở trang đặt lịch" : "Open Booking Page"}
          </Link>
        </div>
      </section>

      {/* Info Section */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h4 className="text-2xl font-black text-gray-900 mb-4">
              {i18n.language === "vi" ? "Dành cho bệnh nhân" : "For Patients"}
            </h4>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-[#E06666] font-bold mt-1">✓</span>
                <span>{i18n.language === "vi" ? "Đặt lịch hẹn dễ dàng" : "Easy appointment booking"}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#E06666] font-bold mt-1">✓</span>
                <span>{i18n.language === "vi" ? "Theo dõi lịch khám" : "Track your appointments"}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#E06666] font-bold mt-1">✓</span>
                <span>{i18n.language === "vi" ? "Tư vấn trực tuyến" : "Online consultations"}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#E06666] font-bold mt-1">✓</span>
                <span>{i18n.language === "vi" ? "Hồ sơ y tế điện tử" : "Digital medical records"}</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-2xl font-black text-gray-900 mb-4">
              {i18n.language === "vi" ? "Dành cho bác sĩ" : "For Doctors"}
            </h4>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-[#E06666] font-bold mt-1">✓</span>
                <span>{i18n.language === "vi" ? "Quản lý lịch làm việc" : "Manage work schedule"}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#E06666] font-bold mt-1">✓</span>
                <span>{i18n.language === "vi" ? "Nhiều chi nhánh" : "Multiple branches"}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#E06666] font-bold mt-1">✓</span>
                <span>{i18n.language === "vi" ? "Tư vấn trực tuyến" : "Online consultations"}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#E06666] font-bold mt-1">✓</span>
                <span>{i18n.language === "vi" ? "Hồ sơ bệnh nhân toàn diện" : "Complete patient records"}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
