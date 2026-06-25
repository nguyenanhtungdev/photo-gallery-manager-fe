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
  FolderOpen,
  HardDrive,
  ImageIcon,
  Images,
  Layers,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import {
  confirmForgotPassword,
  getDefaultRouteForRole,
  getStoredSession,
  loginAdmin,
  loginUser,
  requestForgotPassword,
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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [debugCode, setDebugCode] = useState("");
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "password">("email");
  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
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
    const timeoutId = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timeoutId);
  }, [toast]);

  function resetForgotState() {
    setMode("login");
    setForgotStep("email");
    setShowNewPass(false);
    setShowConfirmPass(false);
    setNewPassword("");
    setConfirmPassword("");
    setVerificationId("");
    setVerificationCode("");
    setVerificationEmail("");
    setDebugCode("");
    setToast(null);
  }

  function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setToast(null);

    if (mode === "forgot") {
      handleForgotPasswordFlow();
      return;
    }

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

  function handleForgotPasswordFlow() {
    if (forgotStep === "email") {
      if (!username.trim()) {
        setToast({ type: "error", message: "Vui lòng nhập email tài khoản." });
        return;
      }

      startTransition(async () => {
        try {
          const data = await requestForgotPassword({
            email: username,
          });
          setVerificationId(data.verificationId);
          setVerificationEmail(data.email);
          setDebugCode(data.debugCode ?? "");
          setVerificationCode("");
          setNewPassword("");
          setConfirmPassword("");
          setForgotStep("otp");
          setToast({
            type: "success",
            message: data.debugCode
              ? `Đã tạo mã xác minh. Mã dev: ${data.debugCode}`
              : "Đã gửi mã xác minh về email. Vui lòng kiểm tra hộp thư.",
          });
        } catch (error) {
          setToast({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Không thể gửi mã xác minh. Vui lòng thử lại.",
          });
        }
      });
      return;
    }

    if (forgotStep === "otp") {
      if (verificationCode.length !== 6) {
        setToast({ type: "error", message: "Vui lòng nhập đủ 6 chữ số xác minh." });
        return;
      }

      setForgotStep("password");
      setToast(null);
      return;
    }

    if (newPassword.length < 6) {
      setToast({ type: "error", message: "Mật khẩu mới phải có ít nhất 6 ký tự." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setToast({ type: "error", message: "Mật khẩu xác nhận không khớp." });
      return;
    }

    if (!verificationId) {
      setToast({ type: "error", message: "Vui lòng gửi mã xác minh trước." });
      return;
    }

    if (verificationCode.length !== 6) {
      setToast({ type: "error", message: "Vui lòng nhập đủ 6 chữ số xác minh." });
      return;
    }

    startTransition(async () => {
      try {
        await confirmForgotPassword({
          verificationId,
          code: verificationCode,
          newPassword,
        });
        setToast({
          type: "success",
          message: "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.",
        });
        setPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setVerificationId("");
        setVerificationCode("");
        setVerificationEmail("");
        setDebugCode("");
        setForgotStep("email");
        setMode("login");
      } catch (error) {
        setToast({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Không thể đặt lại mật khẩu. Vui lòng thử lại.",
        });
      }
    });
  }

  function resendForgotCode() {
    if (!username.trim()) {
      setToast({ type: "error", message: "Vui lòng nhập email tài khoản." });
      return;
    }

    startTransition(async () => {
      try {
        const data = await requestForgotPassword({
          email: username,
        });
        setVerificationId(data.verificationId);
        setVerificationEmail(data.email);
        setDebugCode(data.debugCode ?? "");
        setVerificationCode("");
        setNewPassword("");
        setConfirmPassword("");
        setForgotStep("otp");
        setToast({
          type: "success",
          message: data.debugCode
            ? `Đã gửi lại mã. Mã dev: ${data.debugCode}`
            : "Đã gửi lại mã xác minh.",
        });
      } catch (error) {
        setToast({
          type: "error",
          message: error instanceof Error ? error.message : "Không thể gửi lại mã.",
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
    mode === "forgot"
      ? "Quên mật khẩu"
      : role === "admin" ? "Đăng nhập quản trị" : "Đăng nhập người dùng";
  const rightSubtitle =
    mode === "forgot"
      ? "Nhập email, xác minh mã, rồi tạo mật khẩu mới"
      : role === "admin"
      ? "Truy cập bảng điều khiển quản trị hệ thống"
      : "Truy cập khu vực project cá nhân của bạn";
  const placeholder = role === "admin" ? "admin" : "user@example.com";

  return (
    <>
      <style>{`
        @keyframes lp-float1 { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-28px) scale(1.06)} }
        @keyframes lp-float2 { 0%,100%{transform:translateX(0) scale(1)} 50%{transform:translateX(22px) scale(0.94)} }
        @keyframes lp-float3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-14px,18px) scale(1.08)} }
        @keyframes lp-particle { 0%,100%{transform:translateY(0) scale(1);opacity:.55} 40%{transform:translateY(-22px) scale(1.3);opacity:.9} 70%{transform:translateY(-8px) scale(0.7);opacity:.35} }
        @keyframes lp-fadeup { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes lp-shimmer { 0%{transform:translateX(-160%) skewX(-15deg)} 100%{transform:translateX(260%) skewX(-15deg)} }
        .lp-blob1{animation:lp-float1 8s ease-in-out infinite}
        .lp-blob2{animation:lp-float2 11s ease-in-out infinite}
        .lp-blob3{animation:lp-float3 13s ease-in-out infinite 2s}
        .lp-particle{animation:lp-particle var(--dur,6s) ease-in-out infinite var(--delay,0s)}
        .lp-shimmer{position:absolute;inset:0;background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.13) 50%,transparent 65%);animation:lp-shimmer 3.5s ease-in-out infinite;pointer-events:none;border-radius:inherit}
      `}</style>
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
            <div className="absolute rounded-full -top-24 -left-16 h-96 w-96 bg-white/10 blur-3xl lp-blob1" />
            <div className="absolute rounded-full -bottom-20 -right-12 h-80 w-80 bg-blue-300/20 blur-2xl lp-blob2" />
            <div className="absolute rounded-full top-1/2 left-1/2 h-56 w-56 bg-violet-400/15 blur-2xl lp-blob3" />
            {([
              { top:'18%', left:'10%', w:8,  h:8,  delay:'0s',   dur:'5s'  },
              { top:'62%', left:'70%', w:6,  h:6,  delay:'1.6s', dur:'7s'  },
              { top:'40%', left:'88%', w:10, h:10, delay:'2.8s', dur:'6s'  },
              { top:'80%', left:'22%', w:5,  h:5,  delay:'0.9s', dur:'8.5s'},
              { top:'28%', left:'50%', w:4,  h:4,  delay:'3.4s', dur:'5.5s'},
              { top:'72%', left:'45%', w:7,  h:7,  delay:'1.2s', dur:'9s'  },
            ] as {top:string;left:string;w:number;h:number;delay:string;dur:string}[]).map((p,i)=>(
              <div key={i} className="absolute rounded-full bg-white/50 lp-particle"
                style={{top:p.top,left:p.left,width:p.w,height:p.h,'--delay':p.delay,'--dur':p.dur} as React.CSSProperties} />
            ))}
          </div>
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative z-10 flex items-center gap-3" style={{animation:'lp-fadeup 0.6s ease-out 0.05s both'}}>
            <div className="flex items-center justify-center border shadow-lg h-11 w-11 rounded-2xl border-white/30 bg-white/20">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Photo Gallery
            </span>
          </div>

          <div className="relative z-10 my-auto space-y-7">
            <div className="space-y-4">
              <div style={{animation:'lp-fadeup 0.5s ease-out 0.2s both'}} className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-300" />
                {leftBadge}
              </div>
              <h1 style={{animation:'lp-fadeup 0.6s ease-out 0.35s both'}} className="text-4xl font-extrabold leading-[1.1] tracking-tight text-white drop-shadow xl:text-5xl">
                {leftTitle}
                <br />
                <span className="text-yellow-200">{leftHighlight}</span>
              </h1>
              <p style={{animation:'lp-fadeup 0.5s ease-out 0.5s both'}} className="max-w-xs text-base leading-relaxed text-white/75">
                {leftDescription}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {([
                { icon: ImageIcon,   label: 'Thư viện ảnh thông minh', delay: '0.65s' },
                { icon: Layers,      label: 'Quản lý album & danh mục', delay: '0.78s' },
                { icon: ShieldCheck, label: 'Bảo mật & phân quyền',     delay: '0.91s' },
              ] as {icon:React.ElementType;label:string;delay:string}[]).map(({icon,label,delay})=>(
                <div key={label} style={{animation:`lp-fadeup 0.5s ease-out ${delay} both`}}>
                  <FeaturePill icon={icon} label={label} />
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-2">
            {(
              [
                { bg: "rgba(251,191,36,0.22)",   iconBg: "rgba(251,191,36,0.45)",   value: "348",    label: "PROJECTS",    Icon: FolderOpen   },
                { bg: "rgba(255,255,255,0.12)",  iconBg: "rgba(255,255,255,0.28)",  value: "12,480", label: "ẢNH",         Icon: Images      },
                { bg: "rgba(251,113,133,0.22)",  iconBg: "rgba(251,113,133,0.45)",  value: "96",     label: "KHÁCH HÀNG",  Icon: Users        },
                { bg: "rgba(56,189,248,0.22)",   iconBg: "rgba(56,189,248,0.45)",   value: "2.4 TB", label: "LƯU TRỮ",     Icon: HardDrive    },
                { bg: "rgba(52,211,153,0.22)",   iconBg: "rgba(52,211,153,0.45)",   value: "520",    label: "ALBUMS",      Icon: Layers       },
                { bg: "rgba(167,139,250,0.22)",  iconBg: "rgba(167,139,250,0.45)",  value: "24",     label: "USERS",       Icon: ShieldCheck  },
              ] as { bg: string; iconBg: string; value: string; label: string; Icon: React.ElementType }[]
            ).map(({ bg, iconBg, value, label, Icon }, index) => (
              <div
                key={index}
                style={{ background: bg, border: '1px solid rgba(255,255,255,0.18)', animation: `lp-fadeup 0.5s ease-out ${1.05 + index * 0.1}s both` }}
                className="group relative h-[5rem] rounded-2xl flex flex-col justify-between p-3 overflow-hidden transition-all duration-300 hover:scale-[1.05] hover:shadow-xl cursor-default"
              >
                <div className="lp-shimmer" />
                <div
                  style={{ background: iconBg }}
                  className="w-7 h-7 rounded-xl flex items-center justify-center self-end transition-transform duration-300 group-hover:scale-110 relative z-10"
                >
                  <Icon className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="relative z-10">
                  <p className="text-[15px] font-black text-white leading-none tracking-tight">{value}</p>
                  <p className="text-[8px] font-bold text-white/50 mt-1 leading-none tracking-widest">{label}</p>
                </div>
              </div>
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
              {mode === "forgot" && forgotStep === "otp" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  <p className="font-semibold">Đã gửi mã đến {verificationEmail}</p>
                  <p className="mt-1 text-xs text-emerald-700/80">
                    Nhập mã 6 chữ số, sau đó tạo mật khẩu mới.
                  </p>
                  {debugCode && (
                    <p className="mt-1 text-xs font-semibold text-emerald-800">
                      Mã dev: {debugCode}
                    </p>
                  )}
                </div>
              )}

              {mode === "login" && (
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
              )}

              {mode === "forgot" && forgotStep === "email" && (
                <div className="space-y-1.5">
                  <label
                    htmlFor={`${role}-login-username`}
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Email tài khoản
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                    <input
                      id={`${role}-login-username`}
                      type="email"
                      autoComplete="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="user@example.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
                    />
                  </div>
                </div>
              )}

              {mode === "login" && (
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
              )}

              {mode === "login" && (
                <button
                  type="button"
                  onClick={() => {
                    setMode("forgot");
                    setForgotStep("email");
                    setUsername("");
                    setPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setVerificationId("");
                    setVerificationCode("");
                    setVerificationEmail("");
                    setDebugCode("");
                    setToast(null);
                  }}
                  className="-mt-1 ml-auto block text-sm font-semibold text-violet-600 underline decoration-violet-300 underline-offset-2 transition-colors hover:text-violet-700"
                >
                  Quên mật khẩu?
                </button>
              )}

              {mode === "forgot" && forgotStep === "otp" && (
                <div className="space-y-1.5">
                  <label
                    htmlFor={`${role}-forgot-code`}
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Mã xác minh
                  </label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                    <input
                      id={`${role}-forgot-code`}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="000000"
                      className="w-full rounded-2xl border border-violet-200 bg-white py-3.5 pl-10 pr-4 text-center text-base font-semibold tracking-[0.55em] text-slate-800 shadow-[0_6px_24px_rgba(124,58,237,0.08)] outline-none transition-all placeholder:tracking-[0.25em] placeholder:text-slate-300 hover:border-violet-300 hover:shadow-[0_8px_28px_rgba(124,58,237,0.12)] focus:border-violet-500 focus:ring-4 focus:ring-violet-100/80 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>
                </div>
              )}

              {mode === "forgot" && forgotStep === "password" && (
                <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
                  <p className="font-semibold">Email đã xác minh</p>
                  <p className="mt-1 text-xs text-violet-700/80">
                    Nhập mật khẩu mới để hoàn tất đặt lại mật khẩu.
                  </p>
                </div>
              )}

              {mode === "forgot" && forgotStep === "password" && (
                <>
                  <div className="space-y-1.5">
                    <label
                      htmlFor={`${role}-forgot-new-password`}
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Mật khẩu mới
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                      <input
                        id={`${role}-forgot-new-password`}
                        type={showNewPass ? "text" : "password"}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-12 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass((value) => !value)}
                        aria-label={showNewPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor={`${role}-forgot-confirm-password`}
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Xác nhận mật khẩu mới
                    </label>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                      <input
                        id={`${role}-forgot-confirm-password`}
                        type={showConfirmPass ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-12 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPass((value) => !value)}
                        aria-label={showConfirmPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-600"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="group mt-1 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-200 transition-all duration-200 hover:from-violet-700 hover:to-indigo-700 hover:shadow-violet-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  {isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 rounded-full animate-spin border-white/40 border-t-white" />
                      {mode === "forgot"
                        ? forgotStep === "email"
                          ? "Đang gửi mã..."
                          : forgotStep === "otp"
                            ? "Đang sang bước mật khẩu..."
                            : "Đang đặt lại mật khẩu..."
                        : "Đang đăng nhập..."}
                    </>
                  ) : (
                    <>
                      {mode === "forgot"
                        ? forgotStep === "email"
                          ? "Gửi mã xác minh"
                          : forgotStep === "otp"
                            ? "Tiếp tục"
                            : "Đặt lại mật khẩu"
                        : "Đăng nhập"}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </span>
              </button>

              {mode === "forgot" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={resetForgotState}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
                  >
                    Quay lại đăng nhập
                  </button>
                  {forgotStep !== "email" && (
                    <button
                      type="button"
                      onClick={resendForgotCode}
                      disabled={isPending}
                      className="flex-1 rounded-xl border border-violet-200 bg-violet-50 py-3 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <RotateCcw className="h-4 w-4" />
                        Gửi lại mã
                      </span>
                    </button>
                  )}
                </div>
              )}
            </form>

            {mode === "login" && <div className="relative flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-medium text-slate-400">hoặc</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>}

            {mode === "login" && showRegisterLink ? (
              <p className="text-sm text-center text-slate-500">
                Chưa có tài khoản?{" "}
                <Link
                  href="/register"
                  className="font-semibold underline transition-colors text-violet-600 decoration-violet-300 underline-offset-2 hover:text-violet-700"
                >
                  Tạo tài khoản mới
                </Link>
              </p>
            ) : mode === "login" ? (
              <p className="text-sm text-center text-slate-500">
                Dành riêng cho tài khoản quản trị.
              </p>
            ) : null}
            <p className="mt-8 text-xs text-center text-slate-400">
              Photo Gallery Manager © 2026
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
