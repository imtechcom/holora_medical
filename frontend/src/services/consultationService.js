import api from "./api";

export const consultationService = {
  // Patient creates request
  createRequest: async (data) => {
    const response = await api.post("/consultations", data);
    return response.data;
  },

  // Doctor gets list
  getDoctorRequests: async () => {
    const response = await api.get("/consultations/doctor-requests");
    return response.data;
  },

  // Patient gets list
  getPatientHistory: async () => {
    const response = await api.get("/consultations/my-history");
    return response.data;
  },

  // Get details
  getConsultationDetails: async (id) => {
    const response = await api.get(`/consultations/${id}`);
    return response.data;
  },

  // Get linked consultation for an appointment
  getByAppointmentId: async (appointmentId) => {
    const response = await api.get(`/appointments/${appointmentId}/consultation`);
    return response.data;
  },

  // Add response
  addResponse: async (id, data) => {
    const response = await api.post(`/consultations/${id}/responses`, data);
    return response.data;
  },

  // Doctor reopens a completed consultation
  reopenConsultation: async (id) => {
    const response = await api.patch(`/consultations/${id}/reopen`);
    return response.data;
  },
};
