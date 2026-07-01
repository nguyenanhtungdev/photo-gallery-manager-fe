"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Eye,
  EyeOff,
  Lock,
  Mail,
  X,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  ImageIcon,
  Layers,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
} from "lucide-react";
import {
  confirmRegister,
  getDefaultRouteForRole,
  getStoredSession,
  register,
  saveSession,
  type VerificationStartResponse,
} from "@/lib/auth";

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
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3.5 shadow-xl animate-[authToastIn_0.22s_cubic-bezier(0.16,1,0.3,1)_both] ${isErr ? "bg-red-50 border-red-200 text-red-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}
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
          onClick={onClose}
          className={`shrink-0 p-1 rounded-lg transition-colors ${isErr ? "hover:bg-red-100" : "hover:bg-emerald-100"}`}
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
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
    <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-sm font-medium w-fit">
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </div>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  showPass,
  onToggle,
  autoComplete = "new-password",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  showPass: boolean;
  onToggle: () => void;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-slate-700"
      >
        {label}
      </label>
      <div className="relative group">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
        <input
          id={id}
          type={showPass ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="••••••••"
          required
          minLength={6}
          autoComplete={autoComplete}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-12 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-100 hover:border-slate-300"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {showPass ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function AdminRegisterPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [debugCode, setDebugCode] = useState("");
  const [step, setStep] = useState<"form" | "verify">("form");
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
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
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setToast(null);
    if (step === "form") {
      if (!username.trim()) {
        setToast({ type: "error", message: "Vui lòng nhập địa chỉ email." });
        return;
      }
      if (password.length < 6) {
        setToast({
          type: "error",
          message: "Mật khẩu phải có ít nhất 6 ký tự.",
        });
        return;
      }
      if (password !== confirmPassword) {
        setToast({ type: "error", message: "Mật khẩu xác nhận không khớp." });
        return;
      }
      startTransition(async () => {
        try {
          const data = (await register({
            username,
            password,
          })) as VerificationStartResponse;
          setVerificationId(data.verificationId);
          setVerificationEmail(data.email);
          setDebugCode(data.debugCode ?? "");
          setVerificationCode("");
          setStep("verify");
          setToast({
            type: "success",
            message: data.debugCode
              ? `Đã tạo mã xác minh. Mã dev: ${data.debugCode}`
              : "Đã gửi mã xác minh về email. Vui lòng kiểm tra hộp thư.",
          });
        } catch (err) {
          setToast({
            type: "error",
            message:
              err instanceof Error
                ? err.message
                : "Đăng ký thất bại. Vui lòng thử lại.",
          });
        }
      });
      return;
    }

    if (!verificationId) {
      setToast({ type: "error", message: "Vui lòng gửi mã xác minh trước." });
      return;
    }
    if (verificationCode.length !== 6) {
      setToast({
        type: "error",
        message: "Vui lòng nhập đủ 6 chữ số xác minh.",
      });
      return;
    }

    startTransition(async () => {
      try {
        const session = await confirmRegister({
          verificationId,
          code: verificationCode,
        });
        saveSession(session);
        setToast({
          type: "success",
          message: "Xác minh thành công! Đang chuyển hướng...",
        });
        setTimeout(
          () => router.replace(getDefaultRouteForRole(session.user.role)),
          800,
        );
      } catch (err) {
        setToast({
          type: "error",
          message:
            err instanceof Error
              ? err.message
              : "Xác minh thất bại. Vui lòng thử lại.",
        });
      }
    });
  }

  function resendCode() {
    if (
      !username.trim() ||
      password.length < 6 ||
      password !== confirmPassword
    ) {
      setToast({
        type: "error",
        message: "Hãy kiểm tra lại email và mật khẩu trước khi gửi lại mã.",
      });
      return;
    }

    startTransition(async () => {
      try {
        const data = (await register({
          username,
          password,
        })) as VerificationStartResponse;
        setVerificationId(data.verificationId);
        setVerificationEmail(data.email);
        setDebugCode(data.debugCode ?? "");
        setVerificationCode("");
        setToast({
          type: "success",
          message: data.debugCode
            ? `Đã gửi lại mã. Mã dev: ${data.debugCode}`
            : "Đã gửi lại mã xác minh.",
        });
      } catch (err) {
        setToast({
          type: "error",
          message: err instanceof Error ? err.message : "Không thể gửi lại mã.",
        });
      }
    });
  }

  const strength =
    password.length === 0
      ? 0
      : password.length < 6
        ? 1
        : password.length < 10
          ? 2
          : 3;
  const strengthMeta = [
    null,
    { label: "Yếu", bar: "bg-red-500", text: "text-red-500" },
    { label: "Trung bình", bar: "bg-amber-500", text: "text-amber-500" },
    { label: "Mạnh", bar: "bg-emerald-500", text: "text-emerald-500" },
  ][strength];

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* LEFT */}
        <div className="relative hidden lg:flex lg:w-[48%] xl:w-[50%] flex-col justify-between overflow-hidden p-12 bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-500">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-24 -left-16 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -right-12 w-80 h-80 rounded-full bg-blue-300/20 blur-2xl" />
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
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              Photo Gallery
            </span>
          </div>

          <div className="relative z-10 space-y-7 my-auto">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-semibold tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse" />
                Tạo tài khoản mới
              </div>
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.1] tracking-tight drop-shadow">
                Bắt đầu hành trình
                <br />
                <span className="text-yellow-200">của bạn</span>
              </h1>
              <p className="text-white/75 text-base leading-relaxed max-w-xs">
                Tạo tài khoản quản trị để kiểm soát toàn bộ thư viện ảnh của
                bạn.
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
            ].map((grad, i) => (
              <div
                key={i}
                className={`h-16 rounded-xl bg-gradient-to-br ${grad} border border-white/20 hover:border-white/40 hover:scale-[1.03] transition-all duration-300`}
              />
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white overflow-y-auto">
          <div className="w-full max-w-[380px] py-4">
            <div className="flex items-center justify-center gap-2.5 mb-8 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-200">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-slate-800 font-bold text-base">
                Photo Gallery
              </span>
            </div>

            <div className="mb-7">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mb-2">
                Tạo tài khoản
              </h2>
              <p className="text-slate-500 text-sm">
                Dùng email làm tên đăng nhập
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              {step === "verify" && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-semibold">
                        Đã gửi mã xác minh đến {verificationEmail}
                      </p>
                      <p className="text-xs text-emerald-700/80">
                        Nhập mã 6 chữ số trong email để hoàn tất tạo tài khoản.
                      </p>
                      {debugCode && (
                        <p className="text-xs font-semibold text-emerald-800">
                          Mã dev: {debugCode}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label
                  htmlFor="reg-email"
                  className="block text-sm font-semibold text-slate-700"
                >
                  Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                  <input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={username}
                    disabled={step === "verify"}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-100 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
                  />
                </div>
              </div>

              <PasswordField
                id="reg-password"
                label="Mật khẩu"
                value={password}
                onChange={setPassword}
                showPass={showPass}
                onToggle={() => setShowPass((v) => !v)}
              />

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="flex items-center gap-2 -mt-1">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i <= strength ? (strengthMeta?.bar ?? "bg-slate-300") : "bg-slate-200"}`}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-xs font-semibold ${strengthMeta?.text}`}
                  >
                    {strengthMeta?.label}
                  </span>
                </div>
              )}

              <PasswordField
                id="reg-confirm-password"
                label="Xác nhận mật khẩu"
                value={confirmPassword}
                onChange={setConfirmPassword}
                showPass={showConfirmPass}
                onToggle={() => setShowConfirmPass((v) => !v)}
              />

              {confirmPassword.length > 0 && (
                <p
                  className={`flex items-center gap-1.5 text-xs font-medium -mt-1 ${password === confirmPassword ? "text-emerald-600" : "text-red-500"}`}
                >
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mật khẩu khớp
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5" />
                      Mật khẩu chưa khớp
                    </>
                  )}
                </p>
              )}

              {step === "verify" && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="reg-code"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Mã xác minh
                  </label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                    <input
                      id="reg-code"
                      value={verificationCode}
                      onChange={(e) =>
                        setVerificationCode(
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      placeholder="Nhập 6 số"
                      inputMode="numeric"
                      maxLength={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3.5 text-sm tracking-[0.35em] text-slate-800 placeholder-slate-400 outline-none transition-all focus:bg-white focus:border-violet-500 focus:ring-2 focus:ring-violet-100 hover:border-slate-300"
                    />
                  </div>
                </div>
              )}

              <button
                id="btn-register"
                type="submit"
                disabled={isPending}
                className="w-full mt-1 rounded-xl py-3.5 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-sm shadow-lg shadow-violet-200 hover:from-violet-700 hover:to-indigo-700 hover:shadow-violet-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  {isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {step === "form" ? "Đang gửi mã..." : "Đang xác minh..."}
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      {step === "form"
                        ? "Gửi mã xác minh"
                        : "Xác minh & tạo tài khoản"}
                    </>
                  )}
                </span>
              </button>

              {step === "verify" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    onClick={resendCode}
                    className="flex-1 rounded-xl border border-violet-200 bg-violet-50 py-3 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100"
                  >
                    <span className="inline-flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Gửi lại mã
                    </span>
                  </button>
                </div>
              )}
            </form>

            <div className="relative flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">hoặc</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <p className="text-center text-sm text-slate-500">
              Đã có tài khoản?{" "}
              <Link
                href="/login"
                className="font-semibold text-violet-600 hover:text-violet-700 transition-colors underline underline-offset-2 decoration-violet-300"
              >
                Đăng nhập ngay
              </Link>
            </p>
            <p className="text-center text-xs text-slate-400 mt-6">
              Photo Gallery Manager © 2026
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
