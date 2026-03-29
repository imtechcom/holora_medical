import api from "./api";

// Get all users
export const getAllUsersApi = async () => {
  const response = await api.get("/users");
  return response.data;
};

// Get user by ID
export const getUserByIdApi = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

// Create user
export const createUserApi = async (payload) => {
  const response = await api.post("/users", payload);
  return response.data;
};

// Update user
export const updateUserApi = async (id, payload) => {
  const response = await api.put(`/users/${id}`, payload);
  return response.data;
};

// Delete user
export const deleteUserApi = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

// Assign role to user
export const assignRoleApi = async (payload) => {
  const response = await api.post("/users/assign-role", payload);
  return response.data.data;
};
