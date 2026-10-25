import api from "./client";

export const getPokemon = () => api.get("/pokemons/");
export const createPokemon = (data) => api.post("/pokemons/", data);
export const updatePokemon = (id, data) =>
  api.patch(`/pokemons/${id}/`, data);
export const deletePokemon = (id) => api.delete(`/pokemons/${id}/`);
