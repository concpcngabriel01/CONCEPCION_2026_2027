import api from "./client";

export const getPokemon = () => api.get("/pokemon/");
export const createPokemon = (data) => api.post("/pokemon/", data);
export const updatePokemon = (id, data) => api.put(`/pokemon/${id}/`, data);
export const deletePokemon = (id) => api.delete(`/pokemon/${id}/`);
