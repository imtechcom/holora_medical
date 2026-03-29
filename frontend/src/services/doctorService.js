import api from "./api";

// Get all doctors
export const getAllDoctorsApi = async () => {
  const response = await api.get("/doctors");
  return response.data;
};

// Get doctor by ID
export const getDoctorByIdApi = async (id) => {
  const response = await api.get(`/doctors/${id}`);
  return response.data;
};

// Create doctor
export const createDoctorApi = async (payload) => {
  const response = await api.post("/doctors", payload);
  return response.data;
};

// Update doctor
export const updateDoctorApi = async (id, payload) => {
  const response = await api.put(`/doctors/${id}`, payload);
  return response.data;
};

// Delete doctor
export const deleteDoctorApi = async (id) => {
  const response = await api.delete(`/doctors/${id}`);
  return response.data;
};
