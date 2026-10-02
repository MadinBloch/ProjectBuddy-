export async function apiFetch(url, opts = {}) {
  const res = await fetch(url, {
    method: opts.method || "GET",
    credentials: "include",
    headers: opts.json ? { "Content-Type": "application/json" } : undefined,
    body: opts.json ? JSON.stringify(opts.json) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Request failed");
  }

  return data;
}

export function getBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}
