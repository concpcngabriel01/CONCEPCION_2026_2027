export function getApiErrorMessage(error) {
  const data = error?.response?.data;
  if (typeof data === "string" && data) {
    return data;
  }
  if (data?.detail) {
    return data.detail;
  }
  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, messages]) => {
        const label = field === "non_field_errors" ? "" : `${field}: `;
        const text = Array.isArray(messages) ? messages.join(" ") : String(messages);
        return `${label}${text}`;
      })
      .join(" ");
  }
  return error?.message || "Something went wrong. Please try again.";
}
