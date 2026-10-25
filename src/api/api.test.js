import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { loginUser, registerUser } from "./auth.js";
import api from "./client.js";
import {
  createPokemon,
  deletePokemon,
  getPokemon,
  updatePokemon,
} from "./pokemon.js";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import { AuthContext } from "../context/AuthContext.js";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function renderRoute(path, routePath, element, token = null) {
  return renderToStaticMarkup(
    createElement(
      AuthContext.Provider,
      { value: { token } },
      createElement(
        MemoryRouter,
        { initialEntries: [path] },
        createElement(
          Routes,
          null,
          createElement(Route, { path: routePath, element }),
        ),
      ),
    ),
  );
}

describe("Django API client", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      removeItem: vi.fn(),
    });
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("registers users and logs in through the Django token endpoint", async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({ id: 1, username: "trainer" }, 201))
      .mockResolvedValueOnce(jsonResponse({ access: "access-token", refresh: "refresh-token" }));

    await registerUser({
      username: "trainer",
      password: "Strong-passphrase-93!",
      confirm_password: "Strong-passphrase-93!",
    });
    const tokens = await loginUser({
      username: "trainer",
      password: "Strong-passphrase-93!",
    });

    expect(fetch.mock.calls[0][0]).toBe("http://127.0.0.1:8000/api/users/");
    expect(JSON.parse(fetch.mock.calls[0][1].body).confirm_password).toBe(
      "Strong-passphrase-93!",
    );
    expect(fetch.mock.calls[1][0]).toBe("http://127.0.0.1:8000/api/token/");
    expect(tokens.access).toBe("access-token");
  });

  it("reads, creates with images, patches, and deletes Pokemon through the API", async () => {
    localStorage.getItem.mockReturnValue("access-token");
    fetch
      .mockResolvedValueOnce(jsonResponse([{ id: 7, name: "Sprout" }]))
      .mockResolvedValueOnce(jsonResponse({ id: 8, name: "Flare" }, 201))
      .mockResolvedValueOnce(jsonResponse({ id: 8, name: "Flare evolved" }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    const list = await getPokemon();
    const createData = new FormData();
    createData.append("name", "Flare");
    createData.append("type", "fire");
    await createPokemon(createData);
    const updateData = new FormData();
    updateData.append("name", "Flare evolved");
    await updatePokemon(8, updateData);
    await deletePokemon(8);

    expect(list).toEqual([{ id: 7, name: "Sprout" }]);
    expect(fetch.mock.calls.map(([url, options]) => [url, options.method])).toEqual([
      ["http://127.0.0.1:8000/api/pokemons/", "GET"],
      ["http://127.0.0.1:8000/api/pokemons/", "POST"],
      ["http://127.0.0.1:8000/api/pokemons/8/", "PATCH"],
      ["http://127.0.0.1:8000/api/pokemons/8/", "DELETE"],
    ]);

    const [createOptions, updateOptions] = [
      fetch.mock.calls[1][1],
      fetch.mock.calls[2][1],
    ];
    expect(createOptions.headers.Authorization).toBe("Bearer access-token");
    expect(createOptions.headers["Content-Type"]).toBeUndefined();
    expect(createOptions.body).toBeInstanceOf(FormData);
    expect(updateOptions.headers["Content-Type"]).toBeUndefined();
  });

  it("preserves serializer validation errors for the UI", async () => {
    const errorData = { name: ["This field must be unique."] };
    fetch.mockResolvedValueOnce(jsonResponse(errorData, 400));

    await expect(api.post("/pokemons/", { name: "Duplicate" })).rejects.toMatchObject({
      response: { status: 400, data: errorData },
    });
  });

  it("renders login and registration routes", () => {
    const login = renderRoute("/login", "/login", createElement(Login));
    const register = renderRoute("/register", "/register", createElement(Register));

    expect(login).toContain("Welcome back.");
    expect(register).toContain("Create your account.");
  });

  it("does not render the protected gallery without a token", () => {
    const gallery = createElement(
      ProtectedRoute,
      null,
      createElement("span", null, "PRIVATE_GALLERY"),
    );
    const signedOut = renderRoute("/gallery", "/gallery", gallery);
    const signedIn = renderRoute("/gallery", "/gallery", gallery, "access-token");

    expect(signedOut).not.toContain("PRIVATE_GALLERY");
    expect(signedIn).toContain("PRIVATE_GALLERY");
  });
});
