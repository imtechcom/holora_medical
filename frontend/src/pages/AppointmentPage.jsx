import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getAllDoctorsApi } from "../services/doctorService";
import { appointmentService } from "../services/appointmentService";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AppointmentPage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("booking");
  const [doctors, setDoctors] = useState([]);
  const [myAppointments, setMyAppointments] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [duration, setDuration] = useState(30);
  const [reason, setReason] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (role !== "patient") {
      alert("Chỉ bệnh nhân mới có chức năng tự đặt lịch.");
      navigate("/admin");
      return;
    }

    fetchDoctors();
    fetchMyAppointments();
  }, [role, navigate]);

  useEffect(() => {
    if (selectedDoctor && selectedDate && selectedBranchId) {
      fetchSlots();
    } else {
      setAvailableSlots([]);
      setSelectedSlot("");
    }
  }, [selectedDoctor, selectedDate, duration, selectedBranchId, fetchSlots]);

  const fetchDoctors = async () => {
    try {
      const data = await getAllDoctorsApi();
      setDoctors(data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMyAppointments = async () => {
    try {
      setLoadingList(true);
      const res = await appointmentService.getMyAppointments();
      setMyAppointments(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchSlots = useCallback(async () => {
    try {
      setLoadingSlots(true);
      setSelectedSlot("");
      const res = await appointmentService.getAvailableSlots(
        selectedDoctor.id,
        selectedDate,
        duration,
        selectedBranchId
      );
      setAvailableSlots(res || []);
    } catch (err) {
      console.error("Lỗi lấy slot:", err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedBranchId, selectedDate, selectedDoctor, duration]);

  const selectedDoctorBranches = useMemo(() => {
    if (!selectedDoctor?.branches?.length) return [];
    return selectedDoctor.branches;
  }, [selectedDoctor]);

  const handleBook = async (e) => {
    e.preventDefault();

    if (!selectedDoctor || !selectedDate || !selectedSlot || !reason || !selectedBranchId) {
      alert("Vui lòng chọn bác sĩ, chi nhánh, ngày, giờ và lý do khám.");
      return;
    }

    setIsBooking(true);
    try {
      await appointmentService.bookAppointment({
        doctor_id: selectedDoctor.id,
        specialty_id: selectedDoctor.specialty_id,
        branch_id: Number(selectedBranchId),
        appointment_date: selectedDate,
        start_time: selectedSlot,
        duration_minutes: duration,
        reason,
        appointment_type: "offline",
      });

      alert(`Dat lich thanh cong luc ${selectedSlot}.`);
      setSelectedDoctor(null);
      setSelectedBranchId("");
      setSelectedDate("");
      setReason("");
      setSelectedSlot("");
      setAvailableSlots([]);
      fetchMyAppointments();
      setActiveTab("my_list");
    } catch (err) {
      alert(err.response?.data?.message || "Khong dat lich duoc. Vui long thu lai.");
      fetchSlots();
    } finally {
      setIsBooking(false);
    }
  };

  const handleChooseDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedBranchId("");
    setSelectedSlot("");
    setAvailableSlots([]);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-[#0F766E] via-[#0EA5E9] to-[#2563EB] p-6 text-white shadow-lg">
        <h1 className="text-3xl font-black tracking-tight">Dat Lich Kham Nhanh</h1>
        <p className="mt-2 text-sm text-blue-50">
          Chon bac si, chon chi nhanh, chon khung gio trong va dat lich trong mot luot.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setActiveTab("booking")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "booking" ? "bg-white text-blue-700" : "bg-blue-700/40 text-white"
            }`}
          >
            Dat lich moi
          </button>
          <button
            onClick={() => setActiveTab("my_list")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              activeTab === "my_list" ? "bg-white text-blue-700" : "bg-blue-700/40 text-white"
            }`}
          >
            Lich cua toi
          </button>
        </div>
      </div>

      {activeTab === "booking" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <aside className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-800">1. Chon bac si</h2>
            <div className="max-h-[620px] space-y-3 overflow-y-auto pr-2">
              {doctors.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => handleChooseDoctor(doc)}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    selectedDoctor?.id === doc.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={doc.avatar_url || "https://ui-avatars.com/api/?name=Doctor&background=E2E8F0&color=0F172A"}
                      alt="doctor"
                      className="h-12 w-12 rounded-full border"
                    />
                    <div>
                      <div className="text-sm font-bold text-gray-900">{doc.full_name}</div>
                      <div className="text-xs text-gray-500">{doc.specialty_name || "General"}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {!selectedDoctor ? (
              <div className="flex h-[500px] flex-col items-center justify-center text-gray-400">
                <div className="text-5xl">🩺</div>
                <p className="mt-3">Vui long chon bac si de bat dau.</p>
              </div>
            ) : (
              <form onSubmit={handleBook} className="space-y-5">
                <h2 className="text-lg font-bold text-gray-800">2. Dat lich voi {selectedDoctor.full_name}</h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Chi nhanh</label>
                    <select
                      required
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Chon chi nhanh</option>
                      {selectedDoctorBranches.map((branch) => (
                        <option key={branch.id} value={branch.id}>
                          {branch.name} {branch.code ? `(${branch.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold text-gray-700">Ngay kham</label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Thoi luong</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:outline-none md:w-64"
                  >
                    <option value={30}>30 phut</option>
                    <option value={60}>60 phut</option>
                    <option value={90}>90 phut</option>
                  </select>
                </div>

                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-3 text-sm font-bold text-gray-800">3. Chon gio trong</h3>
                  {loadingSlots ? (
                    <p className="text-sm text-gray-500">Dang tai khung gio...</p>
                  ) : !selectedDate || !selectedBranchId ? (
                    <p className="text-sm text-gray-500">Hay chon ngay va chi nhanh truoc.</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-sm text-red-500">Khong con khung gio phu hop trong ngay nay.</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                      {availableSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedSlot(time)}
                          className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                            selectedSlot === time
                              ? "bg-blue-600 text-white"
                              : "border border-gray-300 bg-white text-gray-700 hover:border-blue-400"
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-700">Ly do kham</label>
                  <textarea
                    required
                    rows={3}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Mo ta trieu chung ngan gon"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isBooking || !selectedSlot || !selectedBranchId}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 font-bold text-white shadow-md transition hover:from-blue-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBooking ? "Dang dat lich..." : "Xac nhan dat lich"}
                </button>
              </form>
            )}
          </section>
        </div>
      )}

      {activeTab === "my_list" && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Ma lich</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Ngay / Gio</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Bac si</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Chi nhanh</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Trang thai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loadingList ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">Dang tai lich hen...</td>
                  </tr>
                ) : myAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">Ban chua co lich hen nao.</td>
                  </tr>
                ) : (
                  myAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-semibold text-blue-600">{app.appointment_code}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div>{new Date(app.appointment_date).toLocaleDateString("vi-VN")}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(app.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          {" - "}
                          {new Date(app.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="font-medium">{app.doctor_name || "-"}</div>
                        <div className="text-xs text-gray-500">{app.specialty_name || "-"}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{app.branch_name || "-"}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                            app.status === "scheduled"
                              ? "bg-yellow-100 text-yellow-800"
                              : app.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : app.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentPage;
