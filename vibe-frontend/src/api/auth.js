import { apiRequest } from "./api";

export const signup = (userData) => {
  return apiRequest("/api/users", "POST", userData);
};

export const login = (userData) => {
  return apiRequest("/api/users/login", "POST", userData);
};

export const getProfile = (token) => {
  return apiRequest("/api/users/profile", "GET", null, token);
};
