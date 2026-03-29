import api from "./api";

// Get all patients
export const getAllPatientsApi = async () => {
  const response = await api.get("/patients");
  return response.data;
};

// Get patient by ID
export const getPatientByIdApi = async (id) => {
  const response = await api.get(`/patients/${id}`);
  return response.data;
};

// Create patient
export const createPatientApi = async (payload) => {
  const response = await api.post("/patients", payload);
  return response.data;
};

// Update patient
export const updatePatientApi = async (id, payload) => {
  const response = await api.put(`/patients/${id}`, payload);
  return response.data;
};

// Delete patient
export const deletePatientApi = async (id) => {
  const response = await api.delete(`/patients/${id}`);
  return response.data;
};
