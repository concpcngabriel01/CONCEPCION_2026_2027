import api from "./client";

export const registerUser = (data) => api.post("/users/", data);

export const loginUser = (data) => api.post("/token/", data);
  