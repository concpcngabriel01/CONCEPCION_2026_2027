export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api"
).replace(/\/+$/, "");

async function request(method, path, body) {
  const token = localStorage.getItem("access");
  const isFormData = body instanceof FormData;
  const headers = {};

  if (body !== undefined && !isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") || "";
  const data =
    response.status === 204
      ? null
      : contentType.includes("application/json")
        ? await response.json()
        : await response.text();

  if (!response.ok) {
    if (
      response.status === 401 &&
      token &&
      path !== "/token/" &&
      path !== "/token/refresh/"
    ) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.assign("/login");
    }

    const error = new Error("The API request failed.");
    error.response = { status: response.status, data };
    throw error;
  }

  return data;
}

const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
};

export default api;
