"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Loader2,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Archive,
  UserRoundCheck,
  Users,
} from "lucide-react";
import {
  getSystemSettings,
  listCleanupJobLogs,
  updateSystemSettings,
  type CleanupJobLog,
  type SystemSettings,
} from "@/lib/system-settings-api";
import { subscribeToCleanupLogsRealtime } from "@/lib/settings-realtime";
import { listUsers, type AdminUser } from "@/lib/users-api";
import { cn, formatDate } from "@/lib/utils";

const DEFAULT_SETTINGS: SystemSettings = {
  paidProjectPhotoRetentionDays: 7,
  paidProjectPhotoCleanupHour: 3,
  paidProjectPhotoCleanupMinute: 0,
  paidProjectPhotoCleanupTarget: "all_users",
  paidProjectPhotoCleanupUserIds: [],
};

const LIMITS = {
  retentionDays: { min: 1, max: 365 },
  hour: { min: 0, max: 23 },
  minute: { min: 0, max: 59 },
};

const USER_PAGE_SIZE = 20;

function clampInteger(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, Math.round(value)));
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const LOG_STATUS_META: Record<
  CleanupJobLog["status"],
  { label: string; className: string; dotColor: string }
> = {
  success: {
    label: "Thành công",
    className: "border-emerald-200/60 bg-emerald-50/80 text-emerald-700",
    dotColor: "bg-emerald-500",
  },
  partial_failed: {
    label: "Có lỗi ảnh",
    className: "border-amber-200/60 bg-amber-50/80 text-amber-700",
    dotColor: "bg-amber-500",
  },
  failed: {
    label: "Thất bại",
    className: "border-red-200/60 bg-red-50/80 text-red-700",
    dotColor: "bg-red-500",
  },
  skipped: {
    label: "Bỏ qua",
    className: "border-slate-200/60 bg-slate-50/80 text-slate-600",
    dotColor: "bg-slate-400",
  },
};

/* ── Shared style tokens ──────────────────────────────────────────── */

const panelClass =
  "group/panel relative overflow-hidden rounded-2xl border border-border/60 bg-white/80 backdrop-blur-sm shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] transition-all duration-500 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06),0_8px_32px_rgba(37,99,235,0.04)] hover:border-primary/15";

const labelClass =
  "mb-2 block text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80";

const inputClass =
  "w-full rounded-xl border border-border/80 bg-slate-50/80 px-3 py-3 text-sm font-semibold outline-none transition-all duration-300 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 focus:shadow-[0_0_0_4px_rgba(37,99,235,0.06)] disabled:opacity-60 hover:border-primary/30";

/* ── Entrance animation hook ──────────────────────────────────────── */

function useStaggeredEntrance(itemCount: number, baseDelay = 60) {
  const [visible, setVisible] = useState<boolean[]>(
    Array(itemCount).fill(false),
  );

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < itemCount; i++) {
      timers.push(
        setTimeout(() => {
          setVisible((prev) => {
            const next = [...prev];
            next[i] = true;
            return next;
          });
        }, i * baseDelay),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [itemCount, baseDelay]);

  return visible;
}

/* ── Main Page Component ──────────────────────────────────────────── */

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [logs, setLogs] = useState<CleanupJobLog[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [userPagination, setUserPagination] = useState({
    total: 0,
    hasMore: false,
    nextOffset: 0,
  });
  const [userSearch, setUserSearch] = useState("");
  const [appliedUserSearch, setAppliedUserSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingMoreUsers, setLoadingMoreUsers] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const loadingUserPageRef = useRef(false);
  const userListRef = useRef<HTMLDivElement | null>(null);

  // Entrance animations
  const sectionVisibility = useStaggeredEntrance(8, 80);

  // Range slider ref for custom styling


  const hasChanges = useMemo(() => {
    return JSON.stringify(settings) !== JSON.stringify(draft);
  }, [settings, draft]);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);
      setLoadingUsers(true);
      setLoadingLogs(true);
      setError(null);

      try {
        const [data, userData, logData] = await Promise.all([
          getSystemSettings(),
          listUsers({ role: "user", limit: USER_PAGE_SIZE, offset: 0 }),
          listCleanupJobLogs(20),
        ]);
        if (!active) return;
        setSettings(data);
        setDraft(data);
        setUsers(userData.users);
        setUserPagination({
          total: userData.pagination.total,
          hasMore: userData.pagination.hasMore,
          nextOffset: userData.pagination.nextOffset,
        });
        setLogs(logData.logs);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải cấu hình hệ thống",
        );
      } finally {
        if (active) {
          setLoading(false);
          setLoadingUsers(false);
          setLoadingLogs(false);
        }
      }
    }

    void loadSettings();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return subscribeToCleanupLogsRealtime({
      onCreated: ({ log }) => {
        setLogs((current) => [
          log,
          ...current.filter((currentLog) => currentLog.id !== log.id),
        ].slice(0, 20));
        setLoadingLogs(false);
      },
    });
  }, []);

  function updateDraft<K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K],
  ) {
    setSaved(false);
    setError(null);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const data = await updateSystemSettings(draft);
      setSettings(data);
      setDraft(data);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể lưu cấu hình hệ thống",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setDraft(settings);
    setSaved(false);
    setError(null);
  }

  async function loadUserPage({
    offset,
    append,
    search,
  }: {
    offset: number;
    append: boolean;
    search?: string;
  }) {
    if (loadingUserPageRef.current) {
      return;
    }

    loadingUserPageRef.current = true;
    if (append) {
      setLoadingMoreUsers(true);
    } else {
      setLoadingUsers(true);
      setUsers([]);
      userListRef.current?.scrollTo({ top: 0 });
    }
    setError(null);

    try {
      const searchTerm = append ? appliedUserSearch : (search ?? "").trim();
      if (!append) {
        setAppliedUserSearch(searchTerm);
      }

      const data = await listUsers({
        role: "user",
        search: searchTerm || undefined,
        offset,
        limit: USER_PAGE_SIZE,
      });
      setUsers((current) => {
        if (!append) {
          return data.users;
        }

        const usersById = new Map(current.map((user) => [user.id, user]));
        data.users.forEach((user) => usersById.set(user.id, user));
        return Array.from(usersById.values());
      });
      setUserPagination({
        total: data.pagination.total,
        hasMore: data.pagination.hasMore,
        nextOffset: data.pagination.nextOffset,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách user",
      );
    } finally {
      loadingUserPageRef.current = false;
      setLoadingUsers(false);
      setLoadingMoreUsers(false);
    }
  }

  async function handleSearchUsers() {
    await loadUserPage({
      offset: 0,
      append: false,
      search: userSearch.trim(),
    });
  }

  async function handleLoadMoreUsers() {
    if (!userPagination.hasMore || loadingUsers || loadingMoreUsers) {
      return;
    }

    await loadUserPage({
      offset: userPagination.nextOffset,
      append: true,
    });
  }

  function handleUserListScroll(event: React.UIEvent<HTMLDivElement>) {
    const target = event.currentTarget;
    const distanceToBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight;

    if (distanceToBottom < 96) {
      void handleLoadMoreUsers();
    }
  }

  function toggleSelectedUser(userId: string) {
    updateDraft(
      "paidProjectPhotoCleanupUserIds",
      draft.paidProjectPhotoCleanupUserIds.includes(userId)
        ? draft.paidProjectPhotoCleanupUserIds.filter(
            (selectedId) => selectedId !== userId,
          )
        : [...draft.paidProjectPhotoCleanupUserIds, userId],
    );
  }

  const selectedUserCount = draft.paidProjectPhotoCleanupUserIds.length;
  const saveDisabled =
    !hasChanges ||
    saving ||
    loading ||
    (draft.paidProjectPhotoCleanupTarget === "selected_users" &&
      selectedUserCount === 0);
  const selectedScopeLabel =
    draft.paidProjectPhotoCleanupTarget === "all_users"
      ? "Tất cả account user"
      : `${selectedUserCount} account được chọn`;


  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 md:py-8">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div
        className={cn(
          "flex flex-col gap-5 transition-all duration-700 lg:flex-row lg:items-end lg:justify-between",
          sectionVisibility[0]
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0",
        )}
      >
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-gradient-to-r from-primary/5 to-accent/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin settings
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
            Cấu hình hệ thống
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
            Quản lý lịch dọn ảnh đã thanh toán, thời gian lưu trữ và nhóm
            account được áp dụng.
          </p>
        </div>

        <div className="flex w-full gap-2.5 sm:w-auto">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges || saving || loading}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border/80 bg-white px-5 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:bg-secondary hover:border-primary/20 hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            <RotateCcw className="h-4 w-4" />
            Hoàn tác
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saveDisabled}
            className={cn(
              "inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-lg transition-all duration-300 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none",
              hasChanges
                ? "bg-gradient-to-r from-primary to-blue-500 shadow-primary/25 hover:shadow-primary/40 hover:shadow-xl"
                : "bg-primary shadow-primary/20 hover:bg-primary/90",
            )}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Lưu cấu hình
          </button>
        </div>
      </div>

      {/* ── Alert Messages ─────────────────────────────────────────── */}
      {error ? (
        <div className="flex animate-[slideDown_0.4s_ease-out] items-start gap-3 rounded-2xl border border-red-200/60 bg-gradient-to-r from-red-50 to-rose-50 px-4 py-3.5 text-sm text-red-700 shadow-sm shadow-red-100/50">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-3.5 w-3.5" />
          </div>
          {error}
        </div>
      ) : null}

      {saved ? (
        <div className="flex animate-[slideDown_0.4s_ease-out] items-start gap-3 rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3.5 text-sm text-emerald-700 shadow-sm shadow-emerald-100/50">
          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </div>
          Đã lưu cấu hình hệ thống thành công
        </div>
      ) : null}

      {/* ── Summary Cards ──────────────────────────────────────────── */}
      <div
        className={cn(
          "grid gap-3 transition-all duration-700 sm:grid-cols-2 xl:grid-cols-4",
          sectionVisibility[1]
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0",
        )}
      >
        <SummaryCard
          icon={<Archive className="h-5 w-5" />}
          iconBg="bg-gradient-to-br from-blue-50 to-indigo-100/80"
          iconColor="text-primary"
          label="Lưu ảnh"
          value={`${draft.paidProjectPhotoRetentionDays} ngày`}
        />
        <SummaryCard
          icon={<CalendarClock className="h-5 w-5" />}
          iconBg="bg-gradient-to-br from-cyan-50 to-sky-100/80"
          iconColor="text-cyan-600"
          label="Bản nháp"
          value={formatTime(
            draft.paidProjectPhotoCleanupHour,
            draft.paidProjectPhotoCleanupMinute,
          )}
        />
        <SummaryCard
          icon={<UserRoundCheck className="h-5 w-5" />}
          iconBg="bg-gradient-to-br from-emerald-50 to-green-100/80"
          iconColor="text-emerald-600"
          label="Phạm vi"
          value={selectedScopeLabel}
        />
        <SummaryCard
          icon={
            <Clock3 className="h-5 w-5" />
          }
          iconBg={
            hasChanges
              ? "bg-gradient-to-br from-amber-50 to-orange-100/80"
              : "bg-gradient-to-br from-slate-50 to-slate-100/80"
          }
          iconColor={hasChanges ? "text-amber-600" : "text-slate-500"}
          label="Trạng thái"
          value={hasChanges ? "Chưa lưu" : "Đã đồng bộ"}
          pulse={hasChanges}
        />
      </div>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <section
        className={cn(
          panelClass,
          "transition-all duration-700",
          sectionVisibility[2]
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0",
        )}
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 transition-opacity duration-500 group-hover/panel:opacity-100" />

        <div className="flex items-start gap-3 border-b border-border/50 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-100/80 shadow-sm shadow-blue-100/50 transition-transform duration-300 group-hover/panel:scale-105">
            <CalendarClock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold">Cron job xóa ảnh</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Cấu hình thời gian lưu ảnh, lịch chạy hằng ngày và account áp
              dụng.
            </p>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1fr)]">
            <div>
              <label className={labelClass}>Giữ ảnh sau thanh toán</label>
              <div className="relative">
                <input
                  type="number"
                  min={LIMITS.retentionDays.min}
                  max={LIMITS.retentionDays.max}
                  value={draft.paidProjectPhotoRetentionDays}
                  onChange={(event) =>
                    updateDraft(
                      "paidProjectPhotoRetentionDays",
                      clampInteger(
                        Number(event.target.value),
                        LIMITS.retentionDays.min,
                        LIMITS.retentionDays.max,
                      ),
                    )
                  }
                  disabled={loading || saving}
                  className={cn(inputClass, "pr-16 text-base")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/60">
                  ngày
                </span>
              </div>
            </div>

            <div>
              <label className={labelClass}>Lịch chạy cron job</label>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <div className="relative">
                  <input
                    type="number"
                    min={LIMITS.hour.min}
                    max={LIMITS.hour.max}
                    value={draft.paidProjectPhotoCleanupHour}
                    onChange={(event) =>
                      updateDraft(
                        "paidProjectPhotoCleanupHour",
                        clampInteger(
                          Number(event.target.value),
                          LIMITS.hour.min,
                          LIMITS.hour.max,
                        ),
                      )
                    }
                    disabled={loading || saving}
                    className={cn(
                      inputClass,
                      "text-center text-xl font-extrabold tracking-widest",
                    )}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    h
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min={LIMITS.minute.min}
                    max={LIMITS.minute.max}
                    value={draft.paidProjectPhotoCleanupMinute}
                    onChange={(event) =>
                      updateDraft(
                        "paidProjectPhotoCleanupMinute",
                        clampInteger(
                          Number(event.target.value),
                          LIMITS.minute.min,
                          LIMITS.minute.max,
                        ),
                      )
                    }
                    disabled={loading || saving}
                    className={cn(
                      inputClass,
                      "text-center text-xl font-extrabold tracking-widest",
                    )}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    m
                  </span>
                </div>

                <div className="flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-50/80 to-sky-50/80 px-3 ring-1 ring-cyan-100/60">
                  <Clock3 className="h-4 w-4 shrink-0 text-cyan-600" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-cyan-600/80">
                      Hằng ngày
                    </p>
                    <p className="truncate text-sm font-extrabold tracking-wide text-cyan-700">
                      {formatTime(
                        draft.paidProjectPhotoCleanupHour,
                        draft.paidProjectPhotoCleanupMinute,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50 pt-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-green-100/80">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Account áp dụng</h3>
                <p className="text-xs text-muted-foreground">
                  Chọn toàn bộ account user hoặc giới hạn theo nhóm cụ thể.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <ScopeButton
                  active={draft.paidProjectPhotoCleanupTarget === "all_users"}
                  onClick={() =>
                    updateDraft("paidProjectPhotoCleanupTarget", "all_users")
                  }
                  disabled={loading || saving}
                  icon={<Users className="h-4 w-4" />}
                  title="Tất cả account user"
                  description="Áp dụng cho mọi project của user thường."
                />
                <ScopeButton
                  active={
                    draft.paidProjectPhotoCleanupTarget === "selected_users"
                  }
                  onClick={() =>
                    updateDraft(
                      "paidProjectPhotoCleanupTarget",
                      "selected_users",
                    )
                  }
                  disabled={loading || saving}
                  icon={<UserRoundCheck className="h-4 w-4" />}
                  title="Chọn account cụ thể"
                  description={`Đã chọn ${selectedUserCount} account.`}
                />
              </div>

              {draft.paidProjectPhotoCleanupTarget === "selected_users" ? (
                <div className="animate-[expandDown_0.3s_ease-out] space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                      <input
                        value={userSearch}
                        onChange={(event) => setUserSearch(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            void handleSearchUsers();
                          }
                        }}
                        placeholder="Tìm user theo email, username..."
                        className={cn(inputClass, "pl-9 font-medium")}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSearchUsers()}
                      disabled={loadingUsers || loadingMoreUsers}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border/80 bg-white px-4 text-sm font-semibold transition-all duration-300 hover:border-primary/20 hover:bg-secondary hover:shadow-sm active:scale-[0.97] disabled:opacity-60"
                    >
                      {loadingUsers ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      Tìm
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
                    <span>
                      Hiển thị {users.length}/{userPagination.total} account
                    </span>
                    {userPagination.hasMore ? (
                      <span>Cuộn xuống để tải thêm</span>
                    ) : users.length > 0 ? (
                      <span>Đã tải hết</span>
                    ) : null}
                  </div>

                  <div
                    ref={userListRef}
                    onScroll={handleUserListScroll}
                    className="max-h-80 space-y-2 overflow-y-auto pr-1"
                  >
                    {loadingUsers ? (
                      <div className="rounded-xl border border-dashed border-border/60 bg-gradient-to-br from-secondary/30 to-slate-50 px-3 py-8 text-center text-sm text-muted-foreground">
                        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-primary/40" />
                        Đang tải danh sách user...
                      </div>
                    ) : users.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/60 bg-gradient-to-br from-secondary/30 to-slate-50 px-3 py-8 text-center text-sm text-muted-foreground">
                        Không tìm thấy account user phù hợp
                      </div>
                    ) : (
                      users.map((user) => {
                        const selected =
                          draft.paidProjectPhotoCleanupUserIds.includes(
                            user.id,
                          );
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => toggleSelectedUser(user.id)}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-all duration-300",
                              selected
                                ? "border-primary/40 bg-gradient-to-r from-primary/[0.06] to-blue-50/80 shadow-sm shadow-primary/5 ring-1 ring-primary/10"
                                : "border-border/60 bg-white hover:border-primary/20 hover:bg-slate-50/80 hover:shadow-sm",
                            )}
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-bold text-foreground">
                                {user.name || user.username}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                {user.email} ·{" "}
                                {user.projectStats.paidProjectCount} project đã
                                thanh toán
                              </span>
                            </span>
                            <span
                              className={cn(
                                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300",
                                selected
                                  ? "scale-110 border-primary bg-primary text-white shadow-sm shadow-primary/30"
                                  : "border-border/80 bg-white",
                              )}
                            >
                              {selected ? (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              ) : null}
                            </span>
                          </button>
                        );
                      })
                    )}
                    {loadingMoreUsers ? (
                      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-slate-50 px-3 py-3 text-sm font-medium text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary/50" />
                        Đang tải thêm account...
                      </div>
                    ) : null}
                  </div>

                  {selectedUserCount === 0 ? (
                    <div className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200/50">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      Chọn ít nhất một account user trước khi lưu cấu hình.
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ── Logs Section ───────────────────────────────────────────── */}
      <section
        className={cn(
          panelClass,
          "transition-all duration-700",
          sectionVisibility[7]
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0",
        )}
      >
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-slate-300/30 to-transparent opacity-0 transition-opacity duration-500 group-hover/panel:opacity-100" />

        <div className="flex flex-col gap-3 border-b border-border/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold">Lịch sử chạy cronjob</h2>
          </div>
        </div>

        <div className="divide-y divide-border/40">
          {loadingLogs ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-primary/30" />
              Đang tải lịch sử cronjob...
            </div>
          ) : logs.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">
              <CalendarClock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/20" />
              Chưa có log chạy cronjob. Log sẽ xuất hiện sau lần cron chạy đúng
              giờ/phút cấu hình.
            </div>
          ) : (
            logs.map((log, index) => {
              const statusMeta = LOG_STATUS_META[log.status];
              return (
                <div
                  key={log.id}
                  className="px-5 py-4 transition-colors duration-200 hover:bg-slate-50/50"
                  style={{
                    animationDelay: `${index * 40}ms`,
                  }}
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold",
                            statusMeta.className,
                          )}
                        >
                          <span
                            className={cn(
                              "inline-block h-1.5 w-1.5 rounded-full",
                              statusMeta.dotColor,
                            )}
                          />
                          {statusMeta.label}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {formatDate(log.startedAt)}
                        </span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                          {formatTime(log.scheduleHour, log.scheduleMinute)} ·{" "}
                          {log.durationMs}ms
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Giữ ảnh {log.retentionDays} ngày ·{" "}
                        {log.target === "all_users"
                          ? "Tất cả account user"
                          : `${log.userIds.length} account được chọn`}
                        {log.cutoffAt
                          ? ` · Hạn xóa trước ${formatDate(log.cutoffAt)}`
                          : ""}
                      </p>
                      {log.errorMessage ? (
                        <div className="mt-3 flex items-start gap-2 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 px-3 py-2 text-xs font-medium text-red-700 ring-1 ring-red-200/40">
                          <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
                          {log.errorMessage}
                        </div>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4 lg:min-w-[420px]">
                      <LogStatBox
                        value={log.scannedProjects}
                        label="project"
                        variant="default"
                      />
                      <LogStatBox
                        value={log.cleanedProjects}
                        label="đã dọn"
                        variant="default"
                      />
                      <LogStatBox
                        value={log.deletedPhotos}
                        label="ảnh xóa"
                        variant="success"
                      />
                      <LogStatBox
                        value={log.failedPhotos}
                        label="ảnh lỗi"
                        variant="danger"
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

/* ── Sub-Components ──────────────────────────────────────────────── */

function SummaryCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  pulse,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  pulse?: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/60 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:border-primary/15",
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-105",
            iconBg,
          )}
        >
          <div className={iconColor}>{icon}</div>
          {pulse ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            </span>
          ) : null}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
            {label}
          </p>
          <p className="truncate text-lg font-extrabold tracking-tight">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function ScopeButton({
  active,
  onClick,
  disabled,
  icon,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group/scope relative rounded-xl border px-4 py-3.5 text-left transition-all duration-300 disabled:opacity-60",
        active
          ? "border-primary/40 bg-gradient-to-br from-primary/[0.06] to-blue-50/80 shadow-sm shadow-primary/5 ring-1 ring-primary/10"
          : "border-border/60 bg-white hover:bg-slate-50/80 hover:border-primary/20 hover:shadow-sm",
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300",
            active
              ? "bg-primary/10 text-primary"
              : "bg-slate-100 text-muted-foreground group-hover/scope:bg-primary/5 group-hover/scope:text-primary/60",
          )}
        >
          {icon}
        </div>
        <span className="block min-w-0 flex-1 truncate text-sm font-bold">
          {title}
        </span>
      </div>
      <span className="mt-1.5 block pl-[38px] text-xs leading-5 text-muted-foreground">
        {description}
      </span>
    </button>
  );
}

function LogStatBox({
  value,
  label,
  variant,
}: {
  value: number;
  label: string;
  variant: "default" | "success" | "danger";
}) {
  const variantClasses = {
    default: "bg-slate-50/80 text-foreground ring-border/30",
    success:
      "bg-gradient-to-br from-emerald-50/80 to-green-50/60 text-emerald-700 ring-emerald-200/40",
    danger:
      "bg-gradient-to-br from-red-50/80 to-rose-50/60 text-red-700 ring-red-200/40",
  };

  const labelClasses = {
    default: "text-muted-foreground",
    success: "text-emerald-600/70",
    danger: "text-red-600/70",
  };

  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2.5 ring-1 transition-all duration-200 hover:shadow-sm",
        variantClasses[variant],
      )}
    >
      <p className="text-base font-extrabold">{value}</p>
      <p className={cn("text-[10px] font-semibold uppercase tracking-wide", labelClasses[variant])}>
        {label}
      </p>
    </div>
  );
}
