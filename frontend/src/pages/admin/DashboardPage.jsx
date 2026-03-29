import React from "react";
import { useAuth } from "../../context/AuthContext";

const stats = [
  { title: "Total Users", value: 128 },
  { title: "Patients", value: 84 },
  { title: "Doctors", value: 16 },
  { title: "Appointments", value: 42 },
];

const DashboardPage = () => {
  const { user, role } = useAuth();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-[#E06666]">
          Welcome to Holora Medical Dashboard
        </h2>
        <p className="mt-2 text-gray-600">
          Logged in as: <span className="font-semibold">{user?.full_name}</span>
        </p>
        <p className="text-gray-600">
          Role: <span className="font-semibold uppercase">{role}</span>
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <div key={item.title} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{item.title}</p>
            <h3 className="mt-2 text-3xl font-bold text-gray-800">
              {item.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-xl font-semibold text-gray-800">
          Quick Overview
        </h3>
        <p className="text-gray-600">
          This is the starting dashboard for Admin, Super Admin, and Doctor.
          From here, you can expand modules like Users, Patients, Appointments,
          Consultations, and AI Analysis.
        </p>
      </div>
    </div>
  );
};

export default DashboardPage;