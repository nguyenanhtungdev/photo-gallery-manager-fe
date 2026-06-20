const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export function getApiUrl(path: string) {
  if (!API_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }

  return `${API_URL}${path}`;
}

export function withApiKeyHeaders(initHeaders: HeadersInit = {}) {
  if (!API_KEY) {
    throw new Error("Missing NEXT_PUBLIC_API_KEY");
  }

  const headers = new Headers(initHeaders);
  headers.set("x-api-key", API_KEY);
  return headers;
}
