"use client";

import { getApiUrl, withApiKeyHeaders } from "./api-config";
import type { ImageResizeSetting } from "./image-resize";
import type { WatermarkSettings } from "./watermark-settings";

export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  username: string;
  role: "admin" | "user";
  avatarUrl?: string | null;
  imageResizeWidth?: ImageResizeSetting;
  watermarkSettings?: WatermarkSettings;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  accessToken: string;
  rememberToken?: string;
  deviceId?: string;
  user: AuthUser;
};

export type VerificationStartResponse = {
  verificationId: string;
  expiresAt: string;
  email: string;
  debugCode?: string;
};

type LoginPayload = {
  username: string;
  password: string;
};

type UserRole = AuthUser["role"];

type RegisterPayload = {
  username: string;
  password: string;
};

type ConfirmRegisterPayload = {
  verificationId: string;
  code: string;
};

type RequestPasswordChangePayload = {
  currentPassword: string;
  newPassword: string;
};

type ConfirmPasswordChangePayload = {
  verificationId: string;
  code: string;
};

type RequestForgotPasswordPayload = {
  email: string;
};

type ConfirmForgotPasswordPayload = {
  verificationId: string;
  code: string;
  newPassword: string;
};

type AuthRequestPayload = Record<string, unknown>;

export type PresignedUpload = {
  key: string;
  uploadUrl: string;
  method: string;
  contentType: string;
  expiresIn: number;
};

const STORAGE_KEY = "photo-gallery-admin-session";
const DEVICE_KEY = "photo-gallery-admin-device-id";

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function saveSession(session: AuthSession) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export async function login(
  payload: LoginPayload,
  options?: {
    requiredRole?: UserRole;
  },
) {
  const deviceId = getDeviceId();
  const deviceName = getDeviceName();
  const session = await requestAuth<AuthSession>("/auth/login", {
    ...payload,
    deviceId,
    deviceName,
    rememberAccount: true,
  });

  if (options?.requiredRole && session.user.role !== options.requiredRole) {
    throw new Error(
      options.requiredRole === "admin"
        ? "Tài khoản này không có quyền truy cập trang quản trị"
        : "Tài khoản quản trị vui lòng đăng nhập tại trang quản trị",
    );
  }

  return {
    ...session,
    deviceId,
  };
}

export async function loginAdmin(payload: LoginPayload) {
  return login(payload, { requiredRole: "admin" });
}

export async function loginUser(payload: LoginPayload) {
  return login(payload, { requiredRole: "user" });
}

export async function register(payload: RegisterPayload) {
  return requestAuth<VerificationStartResponse>("/auth/register", payload);
}

export async function confirmRegister(payload: ConfirmRegisterPayload) {
  const session = await requestAuth<AuthSession>("/auth/register/confirm", payload);
  return {
    ...session,
    deviceId: getDeviceId(),
  };
}

export async function requestPasswordChange(payload: RequestPasswordChangePayload) {
  return requestAuthedAuth<VerificationStartResponse>("/auth/password-change", payload);
}

export async function confirmPasswordChange(payload: ConfirmPasswordChangePayload) {
  return requestAuthedAuth<{ message: string }>("/auth/password-change/confirm", payload);
}

export async function requestForgotPassword(payload: RequestForgotPasswordPayload) {
  return requestAuth<VerificationStartResponse>("/auth/forgot-password", payload);
}

export async function confirmForgotPassword(payload: ConfirmForgotPasswordPayload) {
  return requestAuth<{ message: string }>("/auth/forgot-password/confirm", payload);
}

export function getDefaultRouteForRole(role: UserRole) {
  return role === "admin" ? "/admin/dashboard" : "/dashboard";
}

export async function fetchCurrentUser(accessToken: string) {
  const response = await apiFetch("/auth/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Phiên đăng nhập đã hết hạn"));
  }

  const user = data.user as AuthUser;
  syncStoredUser(user);
  return user;
}

export async function updateUserSettings(payload: {
  imageResizeWidth?: ImageResizeSetting;
  avatarKey?: string | null;
  watermarkSettings?: WatermarkSettings;
}) {
  const response = await apiFetch("/auth/settings", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Không thể lưu cấu hình"));
  }

  const user = data.user as AuthUser;
  syncStoredUser(user);
  return user;
}

export async function createAvatarUploadUrl(payload: {
  fileName: string;
  contentType: string;
  fileSize: number;
}) {
  return request<PresignedUpload>("/auth/avatar/presign-put", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  onProgress?: (progress: number) => void,
) {
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) {
        return;
      }

      const progress = Math.min(100, Math.round((event.loaded / event.total) * 100));
      onProgress(progress);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      reject(new Error(`Upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error("Upload failed due to network error"));
    xhr.send(file);
  });
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const session = getStoredSession();
  if (!session?.accessToken) {
    throw new Error("Vui long dang nhap lai");
  }

  return requestWithSession(path, init, session, true);
}

function syncStoredUser(user: AuthUser) {
  const session = getStoredSession();
  if (!session) {
    return;
  }

  saveSession({
    ...session,
    user,
  });
}

async function requestAuth<T>(path: string, payload: AuthRequestPayload) {
  const response = await fetch(getApiUrl(path), {
    method: "POST",
    headers: withApiKeyHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(payload),
  });

  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Không thể kết nối máy chủ"));
  }

  return data as T;
}

async function requestAuthedAuth<T>(path: string, payload: AuthRequestPayload) {
  const response = await apiFetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, "Không thể kết nối máy chủ"));
  }

  return data as T;
}

async function request<T>(path: string, init: RequestInit = {}) {
  const response = await apiFetch(path, init);

  const data = await readJson(response);
  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        response.status === 401 ? "Phiên đăng nhập đã hết hạn" : "Không thể kết nối máy chủ",
      ),
    );
  }

  return data as T;
}

async function requestWithSession(
  path: string,
  init: RequestInit,
  session: AuthSession,
  allowRetry: boolean,
) {
  const headers = withApiKeyHeaders(init.headers);
  headers.set("Authorization", `Bearer ${session.accessToken}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(getApiUrl(path), {
    ...init,
    headers,
    cache: "no-store",
  });

  if (response.status !== 401 || !allowRetry) {
    if (response.status === 401) {
      clearSessionAndRedirect(session);
    }
    return response;
  }

  const refreshedSession = await tryRememberedLogin(session);
  if (!refreshedSession) {
    clearSessionAndRedirect(session);
    return response;
  }

  saveSession(refreshedSession);
  return requestWithSession(path, init, refreshedSession, false);
}

function clearSessionAndRedirect(session: AuthSession) {
  clearSession();

  if (typeof window === "undefined") {
    return;
  }

  const loginPath = session.user.role === "admin" ? "/admin/login" : "/login";
  const currentPath = `${window.location.pathname}${window.location.search}`;
  if (window.location.pathname === loginPath) {
    return;
  }

  window.location.replace(`${loginPath}?next=${encodeURIComponent(currentPath)}`);
}

async function tryRememberedLogin(session: AuthSession) {
  if (!session.rememberToken || !session.deviceId) {
    return null;
  }

  const response = await fetch(getApiUrl("/auth/remembered-login"), {
    method: "POST",
    headers: withApiKeyHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({
      rememberToken: session.rememberToken,
      deviceId: session.deviceId,
    }),
  });

  const data = await readJson(response);
  if (!response.ok) {
    return null;
  }

  const nextSession = data as AuthSession;
  return {
    ...nextSession,
    rememberToken: nextSession.rememberToken ?? session.rememberToken,
    deviceId: session.deviceId,
  };
}

async function readJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getErrorMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data && "message" in data) {
    const { message } = data as { message?: string | string[] };
    if (Array.isArray(message)) {
      return message[0] ?? fallback;
    }
    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
}

function getDeviceId() {
  if (typeof window === "undefined") {
    return `device-${Date.now()}`;
  }

  let deviceId = window.localStorage.getItem(DEVICE_KEY);
  if (!deviceId) {
    deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    window.localStorage.setItem(DEVICE_KEY, deviceId);
  }

  return deviceId;
}

function getDeviceName() {
  if (typeof window === "undefined") {
    return "Unknown Device";
  }

  const userAgent = navigator.userAgent;
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Safari")) return "Safari";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Edge")) return "Edge";

  return userAgent.split(" ")[0] || "Unknown Device";
}
