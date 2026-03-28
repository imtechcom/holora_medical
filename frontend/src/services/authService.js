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