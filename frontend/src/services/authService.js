import api from "./api";

// API call for user login
export const loginApi = async (payload) => {
  const response = await api.post("/auth/login", payload);
  return response.data;
};

// Future implementation for registration
export const registerApi = async (payload) => {
  const response = await api.post("/auth/register", payload);
  return response.data;
};

// Google sign-in / sign-up
export const googleAuthApi = async (payload) => {
  const response = await api.post("/auth/google", payload);
  return response.data;
};

export const acceptDoctorInviteApi = async (payload) => {
  const response = await api.post("/auth/doctor-invite/accept", payload);
  return response.data;
};

// Quên mật khẩu
export const forgotPasswordApi = async (payload) => {
  const response = await api.post("/auth/forgot-password", payload);
  return response.data;
};

// Đặt lại mật khẩu
export const resetPasswordApi = async (payload) => {
  const response = await api.post("/auth/reset-password", payload);
  return response.data;
};