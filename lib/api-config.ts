const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

export function getApiUrl(path: string) {
  if (!API_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }

  return `${API_URL}${path}`;
}

export function getApiOrigin() {
  if (!API_URL) {
    throw new Error("Missing NEXT_PUBLIC_API_URL");
  }

  return new URL(API_URL).origin;
}

export function getApiKey() {
  if (!API_KEY) {
    throw new Error("Missing NEXT_PUBLIC_API_KEY");
  }

  return API_KEY;
}

export function withApiKeyHeaders(initHeaders: HeadersInit = {}) {
  const headers = new Headers(initHeaders);
  headers.set("x-api-key", getApiKey());
  return headers;
}
