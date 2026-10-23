const BASE_URL = "http://127.0.0.1:8000/api";

async function request(method, url, body) {
const token = localStorage.getItem("access");
const res = await fetch(BASE_URL + url, {
method,
headers: {
"Content-Type": "application/json",
...(token && { Authorization: `Bearer ${token}` }),
},
body: body ? JSON.stringify(body) : undefined,
});

const data = res.status === 204 ? null : await res.json().catch(() => null);

if (!res.ok) {
if (res.status === 401 && token) {
localStorage.removeItem("access");
localStorage.removeItem("refresh");
window.location.href = "/login";
}
const error = new Error("Request failed");
error.response = { status: res.status, data };
throw error;
}

return { data };
}

export default {
get: (url) => request("GET", url),
post: (url, body) => request("POST", url, body),
put: (url, body) => request("PUT", url, body),
delete: (url) => request("DELETE", url),
};

