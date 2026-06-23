"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  ImageIcon,
  Layers,
  Lock,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import {
  getDefaultRouteForRole,
  getStoredSession,
  loginAdmin,
  loginUser,
  saveSession,
} from "@/lib/auth";

type LoginRole = "admin" | "user";

function Toast({
  type,
  message,
  onClose,
}: {
  type: "error" | "success";
  message: string;
  onClose: () => void;
}) {
  const isErr = type === "error";
  return (
    <div
      className={`fixed top-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-xl animate-[fadeSlideDown_0.25s_ease-out] max-w-[calc(100vw-2rem)] ${isErr ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}
    >
      <span
        className={`mt-0.5 shrink-0 ${isErr ? "text-red-500" : "text-emerald-500"}`}
      >
        {isErr ? (
          <AlertCircle className="w-5 h-5" />
        ) : (
          <CheckCircle2 className="w-5 h-5" />
        )}
      </span>
      <p className="flex-1 text-sm font-medium leading-snug">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng"
        className={`shrink-0 rounded-lg p-1 transition-colors ${isErr ? "hover:bg-red-100" : "hover:bg-emerald-100"}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function FeaturePill({
  icon: Icon,
  label,
}: {
  icon: React.ElementType;
  label: string;
}) {
  return (
    <div className="flex w-fit items-center gap-2.5 rounded-full border border-white/30 bg-white/20 px-4 py-2.5 text-sm font-medium text-white backdrop-blur-sm">
      <Icon className="w-4 h-4 shrink-0 text-white/90" />
      {label}
    </div>
  );
}

export function LoginPage({
  role,
  showRegisterLink,
}: {
  role: LoginRole;
  showRegisterLink: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [toast, setToast] = useState<{
    type: "error" | "success";
    message: string;
  } | null>(null);

  useEffect(() => {
    const session = getStoredSession();
    if (session) {
      router.replace(getDefaultRouteForRole(session.user.role));
    }
  }, [router]);

  useEffect(() => {
    if (!toast) return;
    const timeoutId = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeoutId);
  }, [toast]);

  function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setToast(null);

    if (!username.trim()) {
      setToast({ type: "error", message: "Vui lòng nhập tên đăng nhập." });
      return;
    }

    if (!password) {
      setToast({ type: "error", message: "Vui lòng nhập mật khẩu." });
      return;
    }

    startTransition(async () => {
      try {
        const session =
          role === "admin"
            ? await loginAdmin({ username, password })
            : await loginUser({ username, password });

        saveSession(session);
        setToast({
          type: "success",
          message: "Đăng nhập thành công! Đang chuyển hướng...",
        });
        setTimeout(
          () => router.replace(getDefaultRouteForRole(session.user.role)),
          800,
        );
      } catch (error) {
        setToast({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Sai tên đăng nhập hoặc mật khẩu.",
        });
      }
    });
  }

  const leftTitle = role === "admin" ? "Quản lý ảnh" : "Theo dõi project";
  const leftHighlight = role === "admin" ? "chuyên nghiệp" : "nhanh và gọn";
  const leftDescription =
    role === "admin"
      ? "Đăng nhập để quản lý user, project và theo dõi toàn bộ hệ thống ảnh."
      : "Đăng nhập để xem project của bạn, kiểm tra trạng thái thanh toán và mở gallery đã chia sẻ.";
  const leftBadge = role === "admin" ? "Admin Portal" : "User Portal";
  const rightTitle =
    role === "admin" ? "Đăng nhập quản trị" : "Đăng nhập người dùng";
  const rightSubtitle =
    role === "admin"
      ? "Truy cập bảng điều khiển quản trị hệ thống"
      : "Truy cập khu vực project cá nhân của bạn";
  const placeholder = role === "admin" ? "admin" : "user@example.com";

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      <div className="flex flex-col min-h-screen lg:flex-row">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500 p-12 lg:flex lg:w-[48%] xl:w-[50%] lg:flex-col lg:justify-between">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute rounded-full -top-24 -left-16 h-96 w-96 bg-white/10 blur-3xl" />
            <div className="absolute rounded-full -bottom-20 -right-12 h-80 w-80 bg-blue-300/20 blur-2xl" />
          </div>
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex items-center justify-center border shadow-lg h-11 w-11 rounded-2xl border-white/30 bg-white/20">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Photo Gallery
            </span>
          </div>

          <div className="relative z-10 my-auto space-y-7">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-300" />
                {leftBadge}
              </div>
              <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow xl:text-5xl">
                {leftTitle}
                <br />
                <span className="text-yellow-200">{leftHighlight}</span>
              </h1>
              <p className="max-w-xs text-base leading-relaxed text-white/75">
                {leftDescription}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <FeaturePill icon={ImageIcon} label="Thư viện ảnh thông minh" />
              <FeaturePill icon={Layers} label="Quản lý album & danh mục" />
              <FeaturePill icon={ShieldCheck} label="Bảo mật & phân quyền" />
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-2.5">
            {[
              "from-white/30 to-white/10",
              "from-yellow-200/50 to-amber-300/30",
              "from-pink-200/40 to-rose-300/20",
              "from-sky-200/40 to-blue-300/20",
              "from-white/20 to-white/5",
              "from-purple-200/40 to-violet-300/20",
            ].map((grad, index) => (
              <div
                key={index}
                className={`h-16 rounded-xl border border-white/20 bg-gradient-to-br ${grad} transition-all duration-300 hover:scale-[1.03] hover:border-white/40`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center flex-1 p-6 overflow-y-auto bg-white sm:p-10 lg:p-16">
          <div className="w-full max-w-[380px] py-4">
            <div className="mb-8 flex items-center justify-center gap-2.5 lg:hidden">
              <div className="flex items-center justify-center w-10 h-10 shadow-lg rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-violet-200">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-base font-bold text-slate-800">
                Photo Gallery
              </span>
            </div>

            <div className="mb-7">
              <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-slate-800 sm:text-3xl">
                {rightTitle}
              </h2>
              <p className="text-sm text-slate-500">{rightSubtitle}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor={`${role}-login-username`}
                  className="block text-sm font-semibold text-slate-700"
                >
                  Tên đăng nhập
                </label>
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                  <input
                    id={`${role}-login-username`}
                    type="text"
                    autoComplete="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor={`${role}-login-password`}
                  className="block text-sm font-semibold text-slate-700"
                >
                  Mật khẩu
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                  <input
                    id={`${role}-login-password`}
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-12 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((value) => !value)}
                    aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="group mt-1 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition-all duration-200 hover:from-violet-700 hover:to-indigo-700 hover:shadow-violet-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  {isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 rounded-full animate-spin border-white/40 border-t-white" />
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      Đăng nhập
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="relative flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">hoặc</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {showRegisterLink ? (
              <p className="text-sm text-center text-slate-500">
                Chưa có tài khoản?{" "}
                <Link
                  href="/register"
                  className="font-semibold underline transition-colors text-violet-600 decoration-violet-300 underline-offset-2 hover:text-violet-700"
                >
                  Tạo tài khoản mới
                </Link>
              </p>
            ) : (
              <p className="text-sm text-center text-slate-500">
                Dành riêng cho tài khoản quản trị.
              </p>
            )}
            <p className="mt-8 text-xs text-center text-slate-400">
              Photo Gallery Manager © 2026
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
