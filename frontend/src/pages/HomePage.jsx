import React from "react";

const HomePage = () => {
  return (
    <div className="bg-white text-gray-800">

      {/* ===== HERO ===== */}
      <section className="bg-[#FFF5F5] py-16 px-6 text-center">
        <h1 className="text-4xl font-bold text-[#E06666] mb-4">
          Holora Medical
        </h1>
        <p className="text-lg mb-6">
          Online Health Consultation System
        </p>

        <button className="bg-[#E06666] text-white px-6 py-3 rounded-lg hover:bg-red-500">
          Start Consultation
        </button>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="py-16 px-6">
        <h2 className="text-2xl font-semibold text-center mb-10">
          Our Services
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          <div className="p-6 border rounded-lg shadow-sm text-center">
            <h3 className="text-lg font-semibold mb-2">AI Diagnosis</h3>
            <p>Analyze symptoms and images using AI technology.</p>
          </div>

          <div className="p-6 border rounded-lg shadow-sm text-center">
            <h3 className="text-lg font-semibold mb-2">Online Consultation</h3>
            <p>Connect with doctors anytime, anywhere.</p>
          </div>

          <div className="p-6 border rounded-lg shadow-sm text-center">
            <h3 className="text-lg font-semibold mb-2">Medical Records</h3>
            <p>Store and manage your health history securely.</p>
          </div>

        </div>
      </section>

      {/* ===== DOCTORS PREVIEW ===== */}
      <section className="bg-gray-50 py-16 px-6">
        <h2 className="text-2xl font-semibold text-center mb-10">
          Our Doctors
        </h2>

        <div className="grid md:grid-cols-3 gap-6">

          {[1, 2, 3].map((doc) => (
            <div key={doc} className="p-6 bg-white rounded-lg shadow text-center">
              <img
                src="https://via.placeholder.com/100"
                alt="doctor"
                className="mx-auto rounded-full mb-4"
              />
              <h3 className="font-semibold">Dr. John Doe</h3>
              <p className="text-sm text-gray-500">General Dentist</p>
            </div>
          ))}

        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 px-6 text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Ready to consult a doctor?
        </h2>

        <button className="bg-[#E06666] text-white px-6 py-3 rounded-lg hover:bg-red-500">
          Book Appointment
        </button>
      </section>

    </div>
  );
};

export default HomePage;