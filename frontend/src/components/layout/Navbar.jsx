import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center">
      <Link to="/" className="text-xl font-bold text-[#E06666]">
        Holora Medical
      </Link>

      <div className="hidden md:flex gap-6 items-center">
        <Link to="/" className="hover:text-[#E06666]">Home</Link>
        <Link to="/doctors" className="hover:text-[#E06666]">Doctors</Link>
        <Link to="/appointments" className="hover:text-[#E06666]">Appointments</Link>
      </div>

      <div className="flex gap-3 items-center">
        {!isAuthenticated ? (
          <>
            <Link
              to="/login"
              className="border px-4 py-2 rounded-lg hover:bg-gray-100"
            >
              Login
            </Link>

            <Link
              to="/register"
              className="bg-[#E06666] text-white px-4 py-2 rounded-lg hover:bg-red-500"
            >
              Register
            </Link>
          </>
        ) : (
          <>
            <span className="text-sm font-medium">
              Hello, {user?.full_name || "User"}
            </span>

            <button
              onClick={handleLogout}
              className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;