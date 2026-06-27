"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Facebook,
  Eye,
  EyeOff,
  FileVideo,
  Gauge,
  GripVertical,
  History,
  Home,
  KeyRound,
  Image as ImageIcon,
  Instagram,
  Layers3,
  Library,
  Link2,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  UploadCloud,
  X
} from "lucide-react";
import { SchedulingEngine, type SocialProvider } from "@/lib/scheduling-engine";
import { profiles, type ProfileSummary } from "@/lib/demo-data";
import { buildPostDetails, type DashboardPostStatus, type DashboardRecentPost } from "@/lib/dashboard-post-details";
import { buildDashboardAlerts, buildDashboardRecentPosts, buildDashboardStats } from "@/lib/dashboard-stats";
import {
  buildDashboardPostsFromLocalQueue,
  localQueueStorageKey,
  markLocalQueueJobForReprocessing,
  parseLocalQueueJobs,
  removeLocalQueueJobs,
  type LocalQueueJob
} from "@/lib/local-post-queue";
import { buildScheduleMediaItems } from "@/lib/schedule-media";
import { buildScheduleSummary, type SchedulePostType } from "@/lib/schedule-summary";
import { buildUploadRows } from "@/lib/upload-status";

type ViewKey = "dashboard" | "quick" | "calendar" | "profiles" | "accounts" | "logs" | "settings";

const navItems: { key: ViewKey; label: string; icon: React.ElementType }[] = [
  { key: "dashboard", label: "Dashboard", icon: Home },
  { key: "quick", label: "Agendar", icon: Sparkles },
  { key: "calendar", label: "Calendario", icon: CalendarDays },
  { key: "profiles", label: "Perfis", icon: Layers3 },
  { key: "accounts", label: "Contas", icon: Link2 },
  { key: "logs", label: "Logs", icon: History },
  { key: "settings", label: "Configuracoes", icon: Settings }
];

const providerIcons: Record<SocialProvider, React.ElementType> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: FileVideo
};

type RecentPostFilter = "all" | DashboardPostStatus;

type PublishApiResult = {
  id: string;
  status: DashboardPostStatus;
  zernioPostId?: string;
  publishedUrl?: string;
  errorMessage?: string;
};

type LocalPublishJob = LocalQueueJob & {
  id: string;
  profileId: string;
  profileName: string;
  mediaId: string;
  filename: string;
  caption: string;
  mediaUrl: string;
  storageKey?: string;
  destinations: SocialProvider[];
  scheduledAt: string;
  status: DashboardPostStatus;
};

const recentPostFilters: {
  key: RecentPostFilter;
  label: string;
  dotClassName: string;
}[] = [
  { key: "all", label: "Todos", dotClassName: "bg-primary" },
  { key: "published", label: "Publicados", dotClassName: "bg-success" },
  { key: "scheduled", label: "Agendados", dotClassName: "bg-warning" },
  { key: "processing", label: "Processando", dotClassName: "bg-sky-500" },
  { key: "failed", label: "Erros", dotClassName: "bg-danger" }
];

type CalendarPostStatus = "scheduled" | "pending" | "queue" | "processing" | "published" | "partial" | "failed" | "retrying";

type CalendarScheduledPost = {
  id: string;
  date: string;
  filename: string;
  scheduledAt: string;
  status: CalendarPostStatus;
  caption: string;
  destinations: {
    provider: SocialProvider;
    username: string;
    status: CalendarPostStatus;
  }[];
};

const calendarTimeZone = "America/Sao_Paulo";
const calendarLegend: { label: string; className: string }[] = [
  { label: "Agendado", className: "bg-warning" },
  { label: "Pendente", className: "bg-amber-400" },
  { label: "Na Fila", className: "bg-yellow-500" },
  { label: "Processando", className: "bg-sky-500" },
  { label: "Publicado", className: "bg-success" },
  { label: "Parcial", className: "bg-orange-500" },
  { label: "Erro", className: "bg-danger" },
  { label: "Excluido", className: "bg-zinc-500" },
  { label: "Tentando", className: "bg-amber-500" },
  { label: "Reconectar", className: "bg-red-400" }
];

const profileStorageKey = "fastpost_profiles";
const deletedRecentPostsStorageKey = "fastpost_deleted_recent_posts";

export function FastPostApp() {
  const [view, setView] = useState<ViewKey>("dashboard");
  const [session, setSession] = useState<{ name: string; username: string; role: string } | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [profileList, setProfileList] = useState<ProfileSummary[]>(profiles);
  const [profileListHydrated, setProfileListHydrated] = useState(false);
  const [localDashboardPosts, setLocalDashboardPosts] = useState<DashboardRecentPost[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const dashboardAlerts = useMemo(() => buildDashboardAlerts(profileList), [profileList]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.json())
      .then((payload) => setSession(payload.data))
      .finally(() => setLoadingSession(false));
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem(profileStorageKey);

    if (saved !== null) {
      try {
        setProfileList(JSON.parse(saved) as ProfileSummary[]);
      } catch {
        window.localStorage.removeItem(profileStorageKey);
      }
    }

    setProfileListHydrated(true);
  }, []);

  useEffect(() => {
    if (profileListHydrated) {
      window.localStorage.setItem(profileStorageKey, JSON.stringify(profileList));
    }
  }, [profileList, profileListHydrated]);

  useEffect(() => {
    const refreshLocalPosts = () => {
      setLocalDashboardPosts(buildDashboardPostsFromLocalQueue(parseLocalQueueJobs(window.localStorage.getItem(localQueueStorageKey))));
    };

    refreshLocalPosts();
    window.addEventListener("storage", refreshLocalPosts);

    return () => window.removeEventListener("storage", refreshLocalPosts);
  }, []);

  const updateLocalPost = (postId: string, changes: { scheduledAt: string; caption: string }) => {
    const jobs = parseLocalQueueJobs(window.localStorage.getItem(localQueueStorageKey));
    const nextJobs = jobs.map((job) =>
      String(job.id ?? "") === postId
        ? {
            ...job,
            scheduledAt: changes.scheduledAt,
            caption: changes.caption
          }
        : job
    );

    window.localStorage.setItem(localQueueStorageKey, JSON.stringify(nextJobs));
    setLocalDashboardPosts(buildDashboardPostsFromLocalQueue(nextJobs));
  };

  const deleteLocalPost = (postId: string) => {
    const jobs = parseLocalQueueJobs(window.localStorage.getItem(localQueueStorageKey));
    const nextJobs = removeLocalQueueJobs(jobs, [postId]);

    window.localStorage.setItem(localQueueStorageKey, JSON.stringify(nextJobs));
    setLocalDashboardPosts(buildDashboardPostsFromLocalQueue(nextJobs));
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
  };

  if (loadingSession) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-white">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onLogin={setSession} />;
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <aside className={`fixed inset-y-0 left-0 hidden border-r border-border bg-[#0c0c10] p-5 transition-all duration-300 lg:block ${sidebarCollapsed ? "w-24" : "w-72"}`}>
        <div className={`mb-8 flex items-center ${sidebarCollapsed ? "justify-center" : "justify-between gap-3"}`}>
          <div className={`flex min-w-0 items-center gap-3 ${sidebarCollapsed ? "hidden" : ""}`}>
            <div className="grid size-10 shrink-0 place-items-center rounded-card bg-primary font-bold">FP</div>
            <div className="min-w-0">
              <div className="text-lg font-semibold">FastPost</div>
              <div className="truncate text-sm text-subtext">Fila automatica em massa</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarCollapsed((current) => !current)}
            className={`group flex h-10 items-center rounded-full border border-primary/40 bg-primary/10 p-1 text-primary shadow-lg shadow-primary/10 transition hover:border-primary hover:bg-primary/20 ${sidebarCollapsed ? "w-12 justify-center" : "w-16 justify-start"}`}
            title={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            aria-label={sidebarCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            <span className={`grid size-8 place-items-center rounded-full bg-primary text-white transition-transform duration-300 ${sidebarCollapsed ? "translate-x-0" : "translate-x-6"}`}>
              {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </span>
          </button>
        </div>

        {sidebarCollapsed ? (
          <div className="mb-6 grid place-items-center">
            <div className="grid size-11 place-items-center rounded-card bg-primary font-bold">FP</div>
          </div>
        ) : null}

        {!sidebarCollapsed ? null : (
          <div className="mb-4 h-px bg-border" />
        )}

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = view === item.key;
            return (
              <button
                key={item.key}
                className={`flex w-full items-center rounded-card px-3 py-2.5 text-left text-sm transition ${sidebarCollapsed ? "justify-center" : "gap-3"} ${
                  active
                    ? "bg-primary text-white"
                    : "text-subtext hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => setView(item.key)}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={18} />
                {sidebarCollapsed ? null : <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className={`transition-all duration-300 ${sidebarCollapsed ? "lg:pl-24" : "lg:pl-72"}`}>
        <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm text-subtext">FastPost SaaS</div>
              <h1 className="text-2xl font-semibold">{navItems.find((item) => item.key === view)?.label}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden rounded-card border border-border bg-panel px-3 py-2 text-sm text-subtext sm:block">
                {session.name} - {session.role}
              </div>
              <div className="relative">
                <button
                  className="relative grid size-10 place-items-center rounded-card border border-border bg-panel text-subtext hover:text-white"
                  title="Notificacoes"
                  onClick={() => setShowNotifications((current) => !current)}
                >
                  <Bell size={18} />
                  {dashboardAlerts.length ? (
                    <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                      {dashboardAlerts.length}
                    </span>
                  ) : null}
                </button>
                {showNotifications ? (
                  <div className="absolute right-0 top-12 z-40 w-[min(360px,calc(100vw-2rem))] rounded-card border border-border bg-panel p-3 shadow-2xl shadow-black/50">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-sm font-semibold">Notificacoes</div>
                      <Badge tone={dashboardAlerts.length ? "warning" : "success"}>
                        {dashboardAlerts.length ? `${dashboardAlerts.length} alerta(s)` : "Sem alertas"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {dashboardAlerts.length ? (
                        dashboardAlerts.map((alert) => (
                          <div key={alert.id} className="rounded-card border border-border bg-background p-3">
                            <div className="flex items-center gap-2 text-sm font-semibold">
                              <AlertTriangle size={15} className={alert.tone === "danger" ? "text-danger" : "text-warning"} />
                              {alert.title}
                            </div>
                            <div className="mt-1 text-xs text-subtext">{alert.message}</div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-card border border-border bg-background p-3 text-sm text-subtext">
                          Nenhum erro ou perfil desconectado agora.
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
              <button
                className="grid size-10 place-items-center rounded-card border border-border bg-panel text-subtext hover:text-white"
                title="Sair"
                onClick={logout}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
            {navItems.map((item) => (
              <button
                key={item.key}
                className={`whitespace-nowrap rounded-card border px-3 py-2 text-sm ${
                  view === item.key ? "border-primary bg-primary" : "border-border bg-panel text-subtext"
                }`}
                onClick={() => setView(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </header>
        <section className="p-4 lg:p-8">
          {view === "dashboard" && (
            <DashboardView
              profileList={profileList}
              localPosts={localDashboardPosts}
              onLocalPostsChange={setLocalDashboardPosts}
              onOpenCalendar={() => setView("calendar")}
            />
          )}
          {view === "quick" && (
            <QuickScheduleView
              profileList={profileList}
              currentPosts={localDashboardPosts}
              onLocalPostsChange={setLocalDashboardPosts}
            />
          )}
          {view === "calendar" && (
            <CalendarView
              profileList={profileList}
              posts={localDashboardPosts}
              onUpdatePost={updateLocalPost}
              onDeletePost={deleteLocalPost}
            />
          )}
          {view === "profiles" && <ProfilesView profileList={profileList} setProfileList={setProfileList} />}
          {view === "accounts" && <AccountsView profileList={profileList} setProfileList={setProfileList} />}
          {view === "logs" && <LogsView />}
          {view === "settings" && <SettingsView profileList={profileList} />}
        </section>
      </main>
    </div>
  );
}

function LoginScreen({ onLogin }: { onLogin: (session: { name: string; username: string; role: string }) => void }) {
  const [username, setUsername] = useState("Daniel");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const payload = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setError(payload.error ?? "Nao foi possivel entrar.");
      return;
    }

    onLogin(payload.data);
  };

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-background px-4 py-8 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.22),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(22,163,74,0.14),transparent_28%)]" />
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <section className="hidden lg:block">
          <div className="mb-6 inline-flex rounded-card border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
            FastPost OS
          </div>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight">
            Entre e alimente meses de conteudo em poucos minutos.
          </h1>
          <div className="mt-8 grid max-w-2xl gap-3 md:grid-cols-3">
            {[
              ["438", "midias carregadas"],
              ["127", "dias de fila"],
              ["98,7%", "sucesso"]
            ].map(([value, label]) => (
              <div key={label} className="rounded-card border border-border bg-panel/80 p-4">
                <div className="text-2xl font-semibold">{value}</div>
                <div className="text-sm text-subtext">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-card border border-border bg-panel/95 p-6 shadow-2xl shadow-black/40">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-card bg-primary font-bold">FP</div>
            <div>
              <div className="text-xl font-semibold">FastPost</div>
              <div className="text-sm text-subtext">Acesso seguro</div>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm">
              <span className="mb-2 block text-subtext">Usuario</span>
              <div className="flex items-center gap-3 rounded-card border border-border bg-background px-3">
                <User size={18} className="text-subtext" />
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="h-12 w-full bg-transparent outline-none"
                  autoComplete="username"
                />
              </div>
            </label>
            <label className="block text-sm">
              <span className="mb-2 block text-subtext">Senha</span>
              <div className="flex items-center gap-3 rounded-card border border-border bg-background px-3">
                <KeyRound size={18} className="text-subtext" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="h-12 w-full bg-transparent outline-none"
                  autoComplete="current-password"
                />
              </div>
            </label>

            {error ? <div className="rounded-card border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</div> : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-card bg-primary font-medium disabled:opacity-70"
            >
              {submitting ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
              Entrar
            </button>
          </form>

          <div className="mt-5 rounded-card border border-border bg-background p-4 text-sm text-subtext">
            <div className="font-medium text-white">Usuarios criados</div>
            <div className="mt-2">Daniel / tokenize32</div>
            <div>Teste / fastpost-test-2026</div>
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardView({
  profileList,
  localPosts,
  onLocalPostsChange,
  onOpenCalendar
}: {
  profileList: ProfileSummary[];
  localPosts: DashboardRecentPost[];
  onLocalPostsChange: (posts: DashboardRecentPost[]) => void;
  onOpenCalendar: () => void;
}) {
  const [selectedPost, setSelectedPost] = useState<DashboardRecentPost | null>(null);
  const [recentPostFilter, setRecentPostFilter] = useState<RecentPostFilter>("all");
  const [statusOverrides, setStatusOverrides] = useState<Record<string, DashboardPostStatus>>({});
  const [deletedRecentPostIds, setDeletedRecentPostIds] = useState<string[]>([]);
  const [selectedRecentPostIds, setSelectedRecentPostIds] = useState<string[]>([]);
  const [reprocessingPostIds, setReprocessingPostIds] = useState<string[]>([]);
  const dashboardAlerts = useMemo(() => buildDashboardAlerts(profileList), [profileList]);
  const selectedPostDetails = selectedPost ? buildPostDetails(selectedPost) : null;
  const allRecentPosts = useMemo(
    () =>
      localPosts
        .filter((post) => !deletedRecentPostIds.includes(post.id))
        .map((post) => ({
          ...post,
          status: statusOverrides[post.id] ?? post.status
        })),
    [deletedRecentPostIds, localPosts, statusOverrides]
  );
  const availableRecentPosts = useMemo(
    () =>
      buildDashboardRecentPosts({
        profiles: profileList,
        posts: allRecentPosts
      }),
    [allRecentPosts, profileList]
  );
  const stats = useMemo(
    () =>
      buildDashboardStats({
        profiles: profileList,
        posts: availableRecentPosts
      }),
    [availableRecentPosts, profileList]
  );
  const recentPostCounts = useMemo(
    () =>
      availableRecentPosts.reduce(
        (counts, post) => {
          counts.all += 1;
          counts[post.status] += 1;

          return counts;
        },
        {
          all: 0,
          scheduled: 0,
          processing: 0,
          published: 0,
          failed: 0
        } satisfies Record<RecentPostFilter, number>
      ),
    [availableRecentPosts]
  );
  const visibleRecentPosts = useMemo(
    () =>
      recentPostFilter === "all"
        ? availableRecentPosts
        : availableRecentPosts.filter((post) => post.status === recentPostFilter),
    [availableRecentPosts, recentPostFilter]
  );
  const latestPost = availableRecentPosts[0];
  const nextScheduledPost = availableRecentPosts.find((post) => post.status === "scheduled" || post.status === "processing");
  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(deletedRecentPostsStorageKey) ?? "[]") as unknown;

      if (Array.isArray(saved)) {
        setDeletedRecentPostIds(saved.filter((item): item is string => typeof item === "string"));
      }
    } catch {
      window.localStorage.removeItem(deletedRecentPostsStorageKey);
    }
  }, []);
  const syncLocalQueue = (nextQueue: LocalQueueJob[]) => {
    window.localStorage.setItem(localQueueStorageKey, JSON.stringify(nextQueue));
    onLocalPostsChange(buildDashboardPostsFromLocalQueue(nextQueue));
  };
  const markRecentPostsDeleted = (postIds: string[]) => {
    setDeletedRecentPostIds((current) => {
      const next = [...new Set([...current, ...postIds])];

      window.localStorage.setItem(deletedRecentPostsStorageKey, JSON.stringify(next));

      return next;
    });
  };
  const removeRecentPosts = (postIds: string[]) => {
    if (!postIds.length) {
      return;
    }

    const savedQueue = parseLocalQueueJobs(window.localStorage.getItem(localQueueStorageKey));
    syncLocalQueue(removeLocalQueueJobs(savedQueue, postIds));
    markRecentPostsDeleted(postIds);
    setSelectedRecentPostIds((current) => current.filter((id) => !postIds.includes(id)));
    setSelectedPost((current) => (current && postIds.includes(current.id) ? null : current));
  };
  const clearRecentPosts = () => {
    const postIds = availableRecentPosts.map((post) => post.id);

    syncLocalQueue([]);
    markRecentPostsDeleted(postIds);
    setSelectedRecentPostIds([]);
    setSelectedPost(null);
  };
  const toggleRecentPostSelection = (postId: string) => {
    setSelectedRecentPostIds((current) =>
      current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId]
    );
  };
  const toggleAllVisibleRecentPosts = () => {
    const visibleIds = visibleRecentPosts.map((post) => post.id);
    const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedRecentPostIds.includes(id));

    setSelectedRecentPostIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])]
    );
  };
  const reprocessPost = async (post: DashboardRecentPost) => {
    setStatusOverrides((current) => ({ ...current, [post.id]: "processing" }));
    setSelectedPost((current) => (current?.id === post.id ? { ...current, status: "processing" } : current));
    setReprocessingPostIds((current) => (current.includes(post.id) ? current : [...current, post.id]));

    const savedQueue = parseLocalQueueJobs(window.localStorage.getItem(localQueueStorageKey));
    const processingQueue = markLocalQueueJobForReprocessing(savedQueue, post.id);
    const job = processingQueue.find((item) => item.id === post.id);

    if (!job) {
      setStatusOverrides((current) => ({ ...current, [post.id]: "failed" }));
      setSelectedPost((current) => (current?.id === post.id ? { ...current, status: "failed" } : current));
      setReprocessingPostIds((current) => current.filter((id) => id !== post.id));
      return;
    }

    syncLocalQueue(processingQueue);

    try {
      const response = await fetch("/api/scheduling/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: job.profileId,
          profileName: job.profileName ?? job.profile ?? "FastPost",
          posts: [
            {
              id: job.id,
              filename: job.filename,
              caption: job.caption ?? "",
              mediaUrl: job.mediaUrl,
              storageKey: job.storageKey,
              scheduledAt: new Date().toISOString(),
              destinations: job.destinations
            }
          ]
        })
      });
      const payload = await response.json();
      const result = Array.isArray(payload.data?.results) ? payload.data.results[0] : null;
      const nextStatus: DashboardPostStatus = result?.status === "published" || result?.status === "scheduled" ? result.status : "failed";
      const nextQueue = processingQueue.map((item) =>
        item.id === post.id
          ? {
              ...item,
              scheduledAt: new Date().toISOString(),
              status: nextStatus,
              zernioPostId: result?.zernioPostId,
              publishedUrl: result?.publishedUrl,
              errorMessage: result?.errorMessage ?? (!response.ok ? payload.error ?? "Falha ao reprocessar." : "")
            }
          : item
      );

      setStatusOverrides((current) => ({ ...current, [post.id]: nextStatus }));
      setSelectedPost((current) => (current?.id === post.id ? { ...current, status: nextStatus } : current));
      syncLocalQueue(nextQueue);

      if (nextStatus === "published" && result?.publishedUrl) {
        await notifyPublishedPost({
          profileName: String(job.profileName ?? job.profile ?? "FastPost"),
          filename: String(job.filename ?? post.filename),
          destinations: Array.isArray(job.destinations) ? (job.destinations as SocialProvider[]) : [],
          publishedUrl: result.publishedUrl
        });
      }
    } catch (error) {
      const nextQueue = processingQueue.map((item) =>
        item.id === post.id
          ? {
              ...item,
              status: "failed",
              errorMessage: error instanceof Error ? error.message : "Falha ao reprocessar."
            }
          : item
      );

      setStatusOverrides((current) => ({ ...current, [post.id]: "failed" }));
      setSelectedPost((current) => (current?.id === post.id ? { ...current, status: "failed" } : current));
      syncLocalQueue(nextQueue);
    } finally {
      setReprocessingPostIds((current) => current.filter((id) => id !== post.id));
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="mt-1 text-sm text-subtext">Estatisticas calculadas a partir dos perfis e posts carregados neste navegador.</p>
        </div>
      </div>

      {dashboardAlerts.length ? (
        <div className="flex items-start justify-between gap-4 rounded-card border border-warning/40 bg-warning/10 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-card bg-warning/20 text-warning">
              <AlertTriangle size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-warning">Perfil com rede desconectada</div>
              <div className="mt-1 text-xs text-subtext">
                {dashboardAlerts[0].message}
                {dashboardAlerts.length > 1 ? ` Mais ${dashboardAlerts.length - 1} alerta(s) no sino de notificacoes.` : ""}
              </div>
            </div>
          </div>
          <Badge tone="warning">{dashboardAlerts.length} alerta(s)</Badge>
        </div>
      ) : (
      <div className="flex items-center justify-between rounded-card border border-success/40 bg-success/10 p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-card bg-success/20 text-success">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold">Tudo pronto!</div>
            <div className="text-xs text-subtext">Sua conta esta configurada e pronta para publicar.</div>
          </div>
        </div>
        <button className="text-subtext hover:text-white" title="Fechar">x</button>
      </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SpeedMetricCard icon={Layers3} tone="primary" label="Contas nos perfis" value={String(stats.connectedAccounts)} />
        <SpeedMetricCard icon={Clock} tone="warning" label="Agendados" value={String(stats.scheduledPosts)} />
        <SpeedMetricCard icon={Loader2} tone="primary" label="Processando" value={String(stats.processingPosts)} />
        <SpeedMetricCard icon={CheckCircle2} tone="success" label="Publicados" value={String(stats.publishedPosts)} />
        <SpeedMetricCard icon={AlertTriangle} tone="danger" label="Erros" value={String(stats.failedPosts)} />
      </div>

      <div className="rounded-card border border-border bg-panel p-4">
        <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-warning">🔥</span>
            <span className="text-subtext">Taxa de sucesso:</span>
            <span className="font-semibold">{stats.successRate}%</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-success" />
            <span className="text-subtext">Ultimo registro:</span>
            <span className="font-semibold">{latestPost?.profile ?? "-"}</span>
            {latestPost ? <span className="text-subtext">{latestPost.filename}</span> : null}
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays size={15} className="text-primary" />
            <span className="text-subtext">Proximo:</span>
            <span className="font-semibold">{nextScheduledPost?.profile ?? "-"}</span>
            {nextScheduledPost ? <span className="text-subtext">{nextScheduledPost.filename}</span> : null}
          </div>
        </div>
      </div>

      <div className="rounded-card border border-border bg-panel p-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-card bg-primary/20 text-primary">
              <Activity size={17} />
            </div>
            <div className="font-semibold">Operação pessoal</div>
          </div>
          <Badge tone="success">SEM LIMITES COMERCIAIS</Badge>
        </div>
        <div className="grid gap-5 xl:grid-cols-2">
          <UsageBar label="Posts carregados" value={stats.totalPosts} total={Math.max(stats.totalPosts, 1)} helper="Somente posts dos perfis atuais" tone="primary" />
          <UsageBar label="Contas nos perfis" value={stats.connectedAccounts} total={Math.max(stats.connectedAccounts, 1)} helper="Somente perfis carregados" tone="success" />
        </div>
      </div>

      <div className="rounded-card border border-border bg-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-card bg-primary/20 text-primary">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="text-sm text-subtext">Modo de uso</div>
              <div className="text-xl font-semibold text-primary">PESSOAL</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-subtext">
                <Clock size={14} /> Rodando no localhost
              </div>
            </div>
          </div>
          <div className="text-right">
            <Badge tone="success">ATIVO</Badge>
            <div className="mt-5 text-sm text-primary">Uso pessoal</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-subtext">Posts recentes</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {recentPostFilters.map((filter) => {
                const active = recentPostFilter === filter.key;

                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setRecentPostFilter(filter.key)}
                    className={`inline-flex items-center gap-2 rounded-card border px-3 py-2 text-xs font-semibold transition ${
                      active
                        ? "border-primary bg-primary text-white"
                        : "border-border bg-panel text-subtext hover:border-primary/60 hover:text-white"
                    }`}
                  >
                    <span className={`size-2 rounded-full ${filter.dotClassName}`} />
                    <span>{filter.label}</span>
                    <span>{recentPostCounts[filter.key]}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {visibleRecentPosts.length ? (
              <button
                type="button"
                onClick={toggleAllVisibleRecentPosts}
                className="rounded-card border border-border bg-panel px-3 py-2 text-xs font-semibold text-subtext hover:border-primary/60 hover:text-white"
              >
                {visibleRecentPosts.every((post) => selectedRecentPostIds.includes(post.id)) ? "Desmarcar" : "Selecionar"}
              </button>
            ) : null}
            {selectedRecentPostIds.length ? (
              <button
                type="button"
                onClick={() => removeRecentPosts(selectedRecentPostIds)}
                className="inline-flex items-center gap-1 rounded-card border border-danger/50 bg-danger/10 px-3 py-2 text-xs font-semibold text-danger hover:border-danger hover:text-white"
              >
                <Trash2 size={13} />
                Excluir {selectedRecentPostIds.length}
              </button>
            ) : null}
            {availableRecentPosts.length ? (
              <button
                type="button"
                onClick={clearRecentPosts}
                className="inline-flex items-center gap-1 rounded-card border border-danger/40 px-3 py-2 text-xs font-semibold text-danger hover:border-danger hover:bg-danger/10"
              >
                <Trash2 size={13} />
                Excluir tudo
              </button>
            ) : null}
            <button type="button" onClick={onOpenCalendar} className="text-sm text-primary hover:text-white">
              Ver calendario
            </button>
          </div>
        </div>

        {visibleRecentPosts.length === 0 ? (
          <div className="rounded-card border border-border bg-panel p-4 text-sm text-subtext">
            Nenhum post recente para exibir.
          </div>
        ) : null}

        {visibleRecentPosts.map((post) => {
          const details = buildPostDetails(post);

          return (
          <div
            key={post.id}
            className="flex w-full items-center justify-between gap-3 rounded-card border border-border bg-panel p-4 transition hover:border-primary/60 hover:bg-white/[0.03]"
          >
            <input
              type="checkbox"
              checked={selectedRecentPostIds.includes(post.id)}
              onChange={() => toggleRecentPostSelection(post.id)}
              className="size-4 shrink-0 accent-primary"
              aria-label={`Selecionar ${post.filename}`}
            />
            <button
              type="button"
              onClick={() => setSelectedPost(post)}
              className="flex min-w-0 flex-1 items-center gap-3 text-left"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-card bg-primary/20 text-sm font-bold text-primary">R</div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{post.profile}</div>
                <div className="text-xs text-subtext">{post.filename} - {details.scheduledFor.slice(0, 5)}, {details.scheduledFor.slice(12, 17)}</div>
              </div>
            </button>
            <div className="flex shrink-0 items-center gap-2">
              {post.status === "failed" || post.status === "processing" ? (
                <button
                  type="button"
                  onClick={() => reprocessPost(post)}
                  disabled={reprocessingPostIds.includes(post.id)}
                  className="inline-flex items-center gap-1 rounded-card border border-warning/50 bg-warning/10 px-3 py-1 text-xs font-semibold text-warning hover:border-warning hover:text-white"
                  title="Reprocessar post"
                >
                  <RefreshCw size={13} className={reprocessingPostIds.includes(post.id) ? "animate-spin" : ""} />
                  {reprocessingPostIds.includes(post.id) ? "Tentando" : "Reprocessar"}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => removeRecentPosts([post.id])}
                className="grid size-7 place-items-center rounded-card border border-border text-subtext hover:border-danger/60 hover:text-danger"
                title="Excluir post recente"
              >
                <Trash2 size={13} />
              </button>
              <span className={`rounded-card border px-3 py-1 text-xs font-semibold ${recentPostStatusClass(post.status)}`}>
                {details.statusLabel}
              </span>
            </div>
          </div>
          );
        })}
      </div>

      {selectedPostDetails ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Fechar detalhes"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedPost(null)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col border-l border-border bg-panel shadow-2xl shadow-black/50">
            <div className="flex items-start justify-between gap-4 border-b border-border p-5">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">{selectedPostDetails.account}</div>
                <div className="mt-1 text-xs text-subtext">{selectedPostDetails.filename}</div>
              </div>
              <button
                type="button"
                className="grid size-8 shrink-0 place-items-center rounded-card text-subtext hover:bg-white/5 hover:text-white"
                title="Fechar"
                onClick={() => setSelectedPost(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <Badge tone={selectedPostDetails.statusTone}>{selectedPostDetails.statusLabel}</Badge>

              <div className="mt-5 space-y-3">
                <DrawerInfoRow label="Conta" value={selectedPostDetails.account} />
                <DrawerInfoRow label="Arquivo" value={selectedPostDetails.filename} />
                <DrawerInfoRow label="Tipo" value={selectedPostDetails.typeLabel} />
                <DrawerInfoRow label="Agendado para" value={selectedPostDetails.scheduledFor} />
                <DrawerInfoRow label="Batch ID" value={selectedPostDetails.batchId} />
              </div>

              <div className="mt-6">
                <div className="mb-2 text-xs uppercase tracking-wider text-subtext">Legenda</div>
                <div className="whitespace-pre-line rounded-card border border-border bg-background p-4 text-sm leading-relaxed text-subtext">
                  {selectedPostDetails.caption}
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

function recentPostStatusClass(status: DashboardPostStatus) {
  const classes: Record<DashboardPostStatus, string> = {
    scheduled: "border-warning/40 bg-warning/10 text-warning",
    processing: "border-sky-500/40 bg-sky-500/10 text-sky-300",
    published: "border-success/40 bg-success/10 text-success",
    failed: "border-danger/40 bg-danger/10 text-danger"
  };

  return classes[status];
}

function QuickScheduleView({
  profileList,
  currentPosts,
  onLocalPostsChange
}: {
  profileList: ProfileSummary[];
  currentPosts: DashboardRecentPost[];
  onLocalPostsChange: (posts: DashboardRecentPost[]) => void;
}) {
  const defaultProfile = profileList.at(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileId, setProfileId] = useState(profileList.at(-1)?.id ?? "");
  const [destinations, setDestinations] = useState<SocialProvider[]>([]);
  const [mode, setMode] = useState<"individual" | "rapid">("individual");
  const [postType, setPostType] = useState<SchedulePostType>("reels");
  const [mediaCount, setMediaCount] = useState(0);
  const [selectedFileNames, setSelectedFileNames] = useState<string[]>([]);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [retryingMediaIds, setRetryingMediaIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("2026-06-04");
  const [captionMode, setCaptionMode] = useState<"single" | "csv">("single");
  const [caption, setCaption] = useState("");
  const [captionsByMediaId, setCaptionsByMediaId] = useState<Record<string, string>>({});
  const [mediaUrlsByMediaId, setMediaUrlsByMediaId] = useState<Record<string, string>>({});
  const [mediaStorageKeysByMediaId, setMediaStorageKeysByMediaId] = useState<Record<string, string>>({});
  const [activeWeekdays, setActiveWeekdays] = useState([1, 2, 3, 4, 5, 6, 0]);
  const [trialMode, setTrialMode] = useState<"disabled" | "manual" | "automatic">("disabled");
  const [selectedTime, setSelectedTime] = useState("12:00");
  const [scheduleTimes, setScheduleTimes] = useState(["09:00", "12:00", "15:00", "18:00", "21:00"]);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  const selectedProfile = profileList.find((profile) => profile.id === profileId) ?? defaultProfile;
  const connectedProviders = useMemo(
    () => selectedProfile?.accounts.map((account) => account.provider) ?? [],
    [selectedProfile?.accounts]
  );
  const medias = useMemo(() => buildScheduleMediaItems(selectedFileNames, mediaCount), [mediaCount, selectedFileNames]);
  const uploadRows = useMemo(() => buildUploadRows(medias, retryingMediaIds), [medias, retryingMediaIds]);
  const selectedMedia = medias.find((media) => media.id === selectedMediaId) ?? medias[0];
  const scheduleSlots = useMemo(
    () =>
      mode === "rapid"
        ? scheduleTimes.map((time) => {
            const [hour = "0", minute = "0"] = time.split(":");

            return {
              hour: Number(hour),
              minute: Number(minute),
              active: true
            };
          })
        : selectedProfile?.slots ?? [],
    [mode, scheduleTimes, selectedProfile?.slots]
  );
  const captionsByFilename = useMemo(
    () =>
      Object.fromEntries(
        medias.map((media) => [
          media.filename,
          captionsByMediaId[media.id] ?? caption
        ])
      ),
    [caption, captionsByMediaId, medias]
  );
  const preview = useMemo(() => {
    try {
      return new SchedulingEngine().preview({
        profileId,
        media: medias,
        destinations,
        startDate,
        activeWeekdays,
        slots: scheduleSlots,
        existingPosts: currentPosts.map((post) => ({ scheduledAt: post.scheduledAt })),
        captionMode,
        defaultCaption: caption,
        captionsByFilename
      });
    } catch {
      return null;
    }
  }, [activeWeekdays, caption, captionMode, captionsByFilename, currentPosts, destinations, medias, profileId, scheduleSlots, startDate]);
  const summary = buildScheduleSummary({
    profileName: selectedProfile?.name ?? "-",
    destinations,
    postType,
    mediaCount,
    selectedDate: startDate
  });
  const canPublish = Boolean(selectedProfile && destinations.length && mediaCount && activeWeekdays.length && scheduleSlots.length && reviewConfirmed);

  useEffect(() => {
    if (!profileList.length) {
      setProfileId("");
      return;
    }

    if (!profileList.some((profile) => profile.id === profileId)) {
      setProfileId(profileList.at(-1)?.id ?? "");
    }
  }, [profileId, profileList]);

  useEffect(() => {
    setDestinations(connectedProviders);
  }, [connectedProviders]);

  useEffect(() => {
    setCaptionsByMediaId((current) =>
      Object.fromEntries(
        medias
          .filter((media) => current[media.id] !== undefined)
          .map((media) => [media.id, current[media.id]])
      )
    );
    setMediaUrlsByMediaId((current) =>
      Object.fromEntries(
        medias
          .filter((media) => current[media.id] !== undefined)
          .map((media) => [media.id, current[media.id]])
      )
    );
    setMediaStorageKeysByMediaId((current) =>
      Object.fromEntries(
        medias
          .filter((media) => current[media.id] !== undefined)
          .map((media) => [media.id, current[media.id]])
      )
    );
  }, [medias]);

  const toggleDestination = (provider: SocialProvider) => {
    setDestinations((current) =>
      current.includes(provider) ? current.filter((item) => item !== provider) : [...current, provider]
    );
  };
  const selectFiles = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    const names = selectedFiles.map((file) => file.name);

    setSelectedFileNames(names);
    setMediaCount(names.length);
    setSelectedMediaId(names.length ? "selected-1" : null);
    setRetryingMediaIds([]);
    setMediaUrlsByMediaId({});
    setMediaStorageKeysByMediaId({});

    if (!selectedFiles.length) {
      return;
    }

    setPublishMessage({ tone: "warning", text: "Enviando midia para o FastPost..." });

    const uploadedUrls: Record<string, string> = {};
    const uploadedStorageKeys: Record<string, string> = {};
    const uploadErrors: string[] = [];

    for (const [index, file] of selectedFiles.entries()) {
      const form = new FormData();

      form.set("file", file);

      try {
        const response = await fetch("/api/media/upload", {
          method: "POST",
          body: form
        });
        const payload = await response.json();

        if (!response.ok || !payload.ok || !payload.data?.publicUrl) {
          uploadErrors.push(`${file.name}: ${payload.error ?? "falha no upload"}`);
          continue;
        }

        uploadedUrls[`selected-${index + 1}`] = payload.data.publicUrl;
        if (payload.data.storageKey) {
          uploadedStorageKeys[`selected-${index + 1}`] = payload.data.storageKey;
        }
      } catch (error) {
        uploadErrors.push(`${file.name}: ${error instanceof Error ? error.message : "falha no upload"}`);
      }
    }

    setMediaUrlsByMediaId(uploadedUrls);
    setMediaStorageKeysByMediaId(uploadedStorageKeys);
    setPublishMessage({
      tone: uploadErrors.length ? "warning" : "success",
      text: uploadErrors.length
        ? `Algumas midias nao foram armazenadas: ${uploadErrors.join(" | ")}`
        : "Midia armazenada no FastPost. A URL foi preenchida automaticamente."
    });
  };
  const retryMedia = (mediaId: string) => {
    setRetryingMediaIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
    window.setTimeout(() => {
      setRetryingMediaIds((current) => current.filter((item) => item !== mediaId));
    }, 900);
  };
  const retryAllMedia = () => {
    const ids = medias.map((media) => media.id);

    setRetryingMediaIds(ids);
    window.setTimeout(() => setRetryingMediaIds([]), 900);
  };
  const clearMedia = () => {
    setSelectedFileNames([]);
    setSelectedMediaId(null);
    setRetryingMediaIds([]);
    setMediaCount(0);
    setCaptionsByMediaId({});
    setMediaUrlsByMediaId({});
    setMediaStorageKeysByMediaId({});
    setReviewConfirmed(false);
    setPublishMessage(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  const selectedMediaCaption = selectedMedia ? captionsByMediaId[selectedMedia.id] ?? caption : caption;
  const selectedMediaPublicUrl = selectedMedia ? mediaUrlsByMediaId[selectedMedia.id] ?? "" : "";
  const updateSelectedMediaCaption = (value: string) => {
    setCaption(value);

    if (selectedMedia) {
      setCaptionsByMediaId((current) => ({
        ...current,
        [selectedMedia.id]: value
      }));
    }
  };
  const updateSelectedMediaPublicUrl = (value: string) => {
    if (selectedMedia) {
      setMediaUrlsByMediaId((current) => ({
        ...current,
        [selectedMedia.id]: value
      }));
    }
  };
  const applyCaptionToAllVideos = () => {
    const nextCaption = selectedMediaCaption.trim() ? selectedMediaCaption : caption;

    setCaption(nextCaption);
    setCaptionsByMediaId((current) => ({
      ...current,
      ...Object.fromEntries(
        medias
          .filter((media) => !media.filename.match(/\.(jpg|jpeg|png|webp)$/i))
          .map((media) => [media.id, nextCaption])
      )
    }));
    setPublishMessage({ tone: "success", text: "Legenda aplicada aos videos do lote." });
  };
  const improveCaption = () => {
    const baseCaption = caption.trim();
    const nextCaption = baseCaption
      ? `${baseCaption}\n\nSalve para consultar depois e compartilhe com quem tambem vai gostar.`
      : "Legenda base com chamada clara, contexto do conteudo e convite para salvar o post.";

    setCaption(nextCaption);
    setPublishMessage({ tone: "success", text: "Legenda melhorada." });
  };
  const summarizeCaption = () => {
    const baseCaption = caption.trim();

    if (!baseCaption) {
      setPublishMessage({ tone: "warning", text: "Escreva uma legenda antes de resumir." });
      return;
    }

    const sentences = baseCaption
      .split(/(?<=[.!?])\s+|\n+/)
      .map((part) => part.trim())
      .filter(Boolean);
    const nextCaption = (sentences.slice(0, 2).join(" ") || baseCaption).slice(0, 240);

    setCaption(nextCaption);
    setPublishMessage({ tone: "success", text: "Legenda resumida." });
  };
  const addDefaultTags = () => {
    const tags = ["#receitas", "#dicas", "#conteudo", "#brasil"];
    const existing = new Set(caption.match(/#[\p{L}\p{N}_]+/gu) ?? []);
    const missingTags = tags.filter((tag) => !existing.has(tag));

    if (!missingTags.length) {
      setPublishMessage({ tone: "warning", text: "As tags padrao ja estao na legenda." });
      return;
    }

    setCaption(`${caption.trim()}${caption.trim() ? "\n\n" : ""}${missingTags.join(" ")}`);
    setPublishMessage({ tone: "success", text: "Tags adicionadas." });
  };
  const removeMedia = (mediaId: string) => {
    const mediaIndex = medias.findIndex((media) => media.id === mediaId);

    if (mediaIndex < 0) {
      return;
    }

    if (selectedFileNames.length) {
      setSelectedFileNames((current) => current.filter((_, index) => index !== mediaIndex));
      setMediaCount((current) => Math.max(0, current - 1));
    } else {
      setMediaCount((current) => Math.max(0, current - 1));
    }

    setCaptionsByMediaId((current) => {
      const next = { ...current };
      delete next[mediaId];
      return next;
    });
    setMediaUrlsByMediaId((current) => {
      const next = { ...current };
      delete next[mediaId];
      return next;
    });
    setMediaStorageKeysByMediaId((current) => {
      const next = { ...current };
      delete next[mediaId];
      return next;
    });
    setSelectedMediaId((current) => (current === mediaId ? medias.find((media) => media.id !== mediaId)?.id ?? null : current));
    setPublishMessage({ tone: "success", text: "Midia removida do lote." });
  };
  const addScheduleTime = () => {
    setScheduleTimes((current) => (current.includes(selectedTime) ? current : [...current, selectedTime].sort()));
  };
  const removeScheduleTime = (time: string) => {
    setScheduleTimes((current) => current.filter((item) => item !== time));
  };
  const submitSchedule = async (targetStatus: DashboardPostStatus = mode === "rapid" ? "scheduled" : "published") => {
    if (!selectedProfile) {
      return;
    }

    setPublishing(true);
    setPublishMessage(null);

    try {
      const schedule = new SchedulingEngine().preview({
        profileId: selectedProfile.id,
        media: medias,
        destinations,
        startDate,
        activeWeekdays,
        slots: scheduleSlots,
        existingPosts: currentPosts.map((post) => ({ scheduledAt: post.scheduledAt })),
        captionMode,
        defaultCaption: caption,
        captionsByFilename
      });
      const queueJobs: LocalPublishJob[] = schedule.posts.map((post, index) => ({
        id: `queued-${Date.now()}-${index + 1}`,
        profileId: post.profileId,
        profileName: selectedProfile.name,
        mediaId: post.mediaId,
        filename: post.filename,
        caption: post.caption,
        mediaUrl: mediaUrlsByMediaId[post.mediaId]?.trim() ?? "",
        storageKey: mediaStorageKeysByMediaId[post.mediaId],
        destinations: post.destinations,
        scheduledAt: targetStatus === "published" ? new Date().toISOString() : post.scheduledAt,
        status: targetStatus
      }));
      const savedQueue = parseLocalQueueJobs(window.localStorage.getItem(localQueueStorageKey));
      const missingMediaUrls = queueJobs.filter((job) => !job.mediaUrl);

      if (missingMediaUrls.length) {
        const failedQueue = queueJobs.map((job) => ({
          ...job,
          status: "failed",
          errorMessage: "Informe uma URL publica da midia. Upload local ainda nao fica acessivel para a Zernio."
        }));
        const nextQueue = [...savedQueue, ...failedQueue];

        window.localStorage.setItem(localQueueStorageKey, JSON.stringify(nextQueue));
        onLocalPostsChange(buildDashboardPostsFromLocalQueue(nextQueue));
        setPublishMessage({
          tone: "warning",
          text: `${missingMediaUrls.length} post(s) nao foram enviados: cole a URL publica da midia para a Zernio conseguir publicar.`
        });
        return;
      }

      const response = await fetch("/api/scheduling/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfile.id,
          profileName: selectedProfile.name,
          posts: queueJobs.map((job) => ({
            id: job.id,
            filename: job.filename,
            caption: job.caption,
            mediaUrl: job.mediaUrl,
            storageKey: job.storageKey,
            scheduledAt: job.scheduledAt,
            destinations: job.destinations
          }))
        })
      });
      const payload = await response.json();
      const results: PublishApiResult[] = Array.isArray(payload.data?.results) ? payload.data.results : [];
      const resultsById = new Map(results.map((result) => [result.id, result]));
      const nextJobs = queueJobs.map((job) => {
        const result = resultsById.get(job.id);

        return result
          ? {
              ...job,
              status: result.status,
              zernioPostId: result.zernioPostId,
              publishedUrl: result.publishedUrl,
              errorMessage: result.errorMessage
            }
          : { ...job, status: "failed", errorMessage: payload.error ?? "A Zernio nao retornou resultado para este post." };
      });
      const nextQueue = [...savedQueue, ...nextJobs];
      const failedCount = nextJobs.filter((job) => job.status === "failed").length;
      const publishedJobs = nextJobs.filter((job) => job.status === "published" && typeof job.publishedUrl === "string" && job.publishedUrl.length > 0);

      window.localStorage.setItem(localQueueStorageKey, JSON.stringify(nextQueue));
      onLocalPostsChange(buildDashboardPostsFromLocalQueue(nextQueue));
      await Promise.all(
        publishedJobs.map((job) =>
          notifyPublishedPost({
            profileName: job.profileName,
            filename: job.filename,
            destinations: job.destinations,
            publishedUrl: typeof job.publishedUrl === "string" ? job.publishedUrl : undefined
          })
        )
      );
      setPublishMessage({
        tone: failedCount ? "warning" : "success",
        text: failedCount
          ? `${failedCount} de ${nextJobs.length} post(s) falharam. Veja a dashboard e a mensagem da Zernio.`
          : targetStatus === "published"
            ? `${nextJobs.length} post(s) enviado(s) para publicacao real na Zernio.${publishedJobs.length ? " Notificacao enviada com link quando disponivel." : ""}`
            : `${nextJobs.length} post(s) agendado(s) de verdade na Zernio.`
      });
    } catch (error) {
      setPublishMessage({
        tone: "warning",
        text: error instanceof Error ? error.message : "Nao foi possivel confirmar o agendamento."
      });
    } finally {
      setPublishing(false);
    }
  };
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Programar Posts(V2)</h2>
        <p className="mt-1 text-sm text-subtext">Configure perfil, destinos, midia e agenda com clareza.</p>
      </div>

      <div className="inline-flex rounded-card border border-border bg-panel p-1">
        <button
          type="button"
          onClick={() => setMode("individual")}
          className={`inline-flex items-center gap-2 rounded-card px-4 py-2 text-sm font-semibold ${
            mode === "individual" ? "bg-primary text-white" : "text-subtext hover:text-white"
          }`}
        >
          <Sparkles size={15} />
          Individual
        </button>
        <button
          type="button"
          onClick={() => setMode("rapid")}
          className={`inline-flex items-center gap-2 rounded-card px-4 py-2 text-sm font-semibold ${
            mode === "rapid" ? "bg-primary text-white" : "text-subtext hover:text-white"
          }`}
        >
          <RefreshCw size={15} />
          Rapido
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-5">
          <ScheduleBlock step="1" title="Perfil" active>
            <div className="flex items-center gap-3 rounded-card border border-border bg-background px-3 py-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-pink-600 text-xs font-bold">
                {selectedProfile?.avatar ?? "FP"}
              </div>
              <select
                value={profileId}
                onChange={(event) => setProfileId(event.target.value)}
                className="h-10 w-full min-w-0 rounded-card bg-background px-2 text-sm font-semibold text-white outline-none focus:border-primary"
              >
                {profileList.map((profile) => (
                  <option key={profile.id} value={profile.id} className="bg-background text-white">
                    {profile.name}
                    {profile.accounts.length ? ` - ${profile.accounts.map((account) => account.username).join(", ")}` : " - nenhuma rede conectada"}
                  </option>
                ))}
              </select>
            </div>
          </ScheduleBlock>

          <ScheduleBlock step="2" title="Onde publicar">
            <div className="space-y-4">
              {(["instagram", "facebook", "tiktok"] as SocialProvider[]).map((provider) => {
                const Icon = providerIcons[provider];
                const account = selectedProfile?.accounts.find((item) => item.provider === provider);
                const checked = destinations.includes(provider);

                return (
                  <div key={provider} className="border-b border-border/70 pb-4 last:border-b-0 last:pb-0">
                    <button
                      type="button"
                      onClick={() => toggleDestination(provider)}
                      className="mb-2 inline-flex items-center gap-2 text-sm font-semibold capitalize"
                    >
                      <Icon size={16} className={checked ? "text-primary" : "text-subtext"} />
                      {provider}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleDestination(provider)}
                      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                        checked ? "border-primary/50 bg-primary/15 text-white" : "border-border bg-background text-subtext"
                      }`}
                    >
                      <span className="size-2 rounded-full bg-primary" />
                      <span className="truncate">{account?.username ?? `Conectar ${provider}`}</span>
                    </button>
                  </div>
                );
              })}
              {!destinations.length ? (
                <div className="text-center text-xs text-warning">Selecione pelo menos uma rede para publicar</div>
              ) : null}
            </div>
          </ScheduleBlock>

          <ScheduleBlock step="3" title="Tipo de Publicacao">
            <div className="grid gap-3 md:grid-cols-3">
              {[
                { key: "reels", label: "Reels", helper: "Videos verticais", icon: FileVideo },
                { key: "feed", label: "Feed", helper: "Imagem no feed", icon: ImageIcon },
                { key: "carousel", label: "Carrossel", helper: "Multiplos itens", icon: Layers3 }
              ].map((item) => {
                const Icon = item.icon;
                const active = postType === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setPostType(item.key as SchedulePostType)}
                    className={`rounded-card border p-5 text-center transition ${
                      active ? "border-primary bg-primary/15 text-primary" : "border-border bg-background text-subtext hover:text-white"
                    }`}
                  >
                    <Icon className="mx-auto mb-3" size={22} />
                    <div className="text-sm font-semibold">{item.label}</div>
                    <div className="mt-1 text-xs text-subtext">{item.helper}</div>
                  </button>
                );
              })}
            </div>
          </ScheduleBlock>

          <ScheduleBlock title="Modo Trial Real (Reels de Teste)" icon={Sparkles}>
            <p className="text-sm text-subtext">
              Trial Reels sao compartilhados inicialmente apenas com seguidores. Apos graduacao, ficam visiveis para todos.
            </p>
            <div className="mt-3 rounded-card border border-white/70 bg-background px-3 py-2 text-xs font-semibold">
              Atencao: Trial Reels so funcionam para contas com 200+ seguidores. Se sua conta tiver menos, o post sera publicado sem parametros de teste.
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["disabled", "Desativado"],
                ["manual", "Manual (via App)"],
                ["automatic", "Automatico (Performance)"]
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTrialMode(key as typeof trialMode)}
                  className={`rounded-card border px-3 py-2 text-xs font-semibold ${
                    trialMode === key ? "border-primary bg-primary text-white" : "border-border bg-background text-subtext"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </ScheduleBlock>

          <ScheduleBlock step="4" title="Upload">
            {medias.length ? (
              <div className="mb-3 flex items-center justify-end">
                <Badge tone="neutral">{medias.length} arquivo{medias.length > 1 ? "s" : ""}</Badge>
              </div>
            ) : null}
            <div
              className="rounded-card border border-dashed border-border bg-background p-8 text-center"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                selectFiles(event.dataTransfer.files);
              }}
            >
              <UploadCloud className="mx-auto mb-3 text-subtext" size={36} />
              <div className="text-sm font-semibold">Arraste videos ou clique para selecionar</div>
              <div className="mt-1 text-xs text-subtext">Formatos aceitos: MP4, MOV, WEBM</div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(event) => selectFiles(event.target.files)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 rounded-card border border-primary/50 bg-primary/15 px-4 py-2 text-sm font-semibold text-primary"
              >
                Escolher arquivos
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedFileNames([]);
                  const count = mode === "rapid" ? 8 : 1;
                  setMediaCount(count);
                  setSelectedMediaId("upload-1");
                  setRetryingMediaIds([]);
                }}
                className="ml-2 mt-4 rounded-card border border-border px-4 py-2 text-sm font-semibold text-subtext hover:text-white"
              >
                Usar exemplo
              </button>
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-warning">
                <AlertTriangle size={14} /> Somente videos 1080x1920 9:16 vertical sao aceitos para Instagram Reels.
              </div>
              <div className="mt-2 text-xs text-subtext">
                Ao selecionar arquivos, o FastPost armazena a midia e preenche a URL automaticamente.
              </div>
            </div>
            {uploadRows.length ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-subtext">
                    {uploadRows.filter((row) => !row.retrying).length}/{uploadRows.length} selecionados
                  </span>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={retryAllMedia} className="inline-flex items-center gap-1 text-primary hover:text-white">
                      <RefreshCw size={13} /> Reenviar todos
                    </button>
                    <button type="button" onClick={clearMedia} className="text-subtext hover:text-white">
                      Limpar
                    </button>
                  </div>
                </div>
                {uploadRows.map((media) => (
                  <div
                    key={media.id}
                    onClick={() => setSelectedMediaId(media.id)}
                    className={`w-full rounded-card border p-3 text-left transition ${
                      selectedMedia?.id === media.id ? "border-primary/60 bg-primary/10" : "border-border bg-background"
                    }`}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <CheckCircle2 size={13} className={media.retrying ? "text-warning" : "text-success"} />
                          <span className={media.retrying ? "text-warning" : "text-success"}>{media.statusLabel}</span>
                        </div>
                        <div className="mt-1 truncate text-sm font-semibold">{media.filename}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            retryMedia(media.id);
                          }}
                          className="grid size-8 place-items-center rounded-card border border-border text-subtext hover:border-primary/60 hover:text-white"
                          title="Reenviar arquivo"
                        >
                          <RefreshCw size={15} className={media.retrying ? "animate-spin text-warning" : ""} />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeMedia(media.id);
                          }}
                          className="grid size-8 place-items-center rounded-card border border-border text-subtext hover:border-danger/60 hover:text-danger"
                          title="Remover midia"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${media.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </ScheduleBlock>

          {mode === "individual" ? (
            <ScheduleBlock title="Editar Midia" icon={FileVideo}>
              {selectedMedia ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-[160px_1fr]">
                    <div className="grid aspect-video place-items-center rounded-card border border-border bg-background text-primary">
                      {selectedMedia.filename.match(/\.(jpg|jpeg|png|webp)$/i) ? <ImageIcon size={28} /> : <FileVideo size={28} />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{selectedMedia.filename}</div>
                      <textarea
                        value={selectedMediaCaption}
                        onChange={(event) => updateSelectedMediaCaption(event.target.value)}
                        placeholder="Legenda do post individual..."
                        className="mt-3 min-h-24 w-full rounded-card border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                      />
                      <div className="mt-1 text-right text-xs text-subtext">{selectedMediaCaption.length}/2200</div>
                      <input
                        value={selectedMediaPublicUrl}
                        onChange={(event) => updateSelectedMediaPublicUrl(event.target.value)}
                        placeholder="URL da midia armazenada"
                        className="mt-3 h-10 w-full rounded-card border border-border bg-background px-3 text-xs outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={applyCaptionToAllVideos}
                      disabled={!medias.length}
                      className="inline-flex items-center gap-2 rounded-card border border-border bg-background px-3 py-2 text-xs font-semibold text-subtext hover:border-primary/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Layers3 size={14} />
                      Aplicar a todos os videos
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewConfirmed((current) => !current)}
                      className={`inline-flex items-center gap-2 rounded-card border px-3 py-2 text-xs font-semibold ${
                        reviewConfirmed ? "border-success/50 bg-success/15 text-success" : "border-border bg-background text-subtext hover:text-white"
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      {reviewConfirmed ? "Tudo correto" : "Confirmar revisao"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid min-h-28 place-items-center rounded-card border border-border bg-background text-center text-sm text-subtext">
                  <div>
                    <FileVideo className="mx-auto mb-2" size={28} />
                    Selecione uma midia no painel acima para editar
                  </div>
                </div>
              )}
            </ScheduleBlock>
          ) : null}

          {mode === "rapid" ? (
            <ScheduleBlock step="5" title="Configurar Agenda">
              <div className="space-y-4">
                <label className="text-sm">
                  <span className="mb-2 block text-subtext">Data de inicio</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                    className="h-11 w-full rounded-card border border-border bg-background px-3 outline-none focus:border-primary"
                  />
                </label>
                <div>
                  <div className="mb-2 text-sm text-subtext">Dias da semana</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      ["Dom", 0],
                      ["Seg", 1],
                      ["Ter", 2],
                      ["Qua", 3],
                      ["Qui", 4],
                      ["Sex", 5],
                      ["Sab", 6]
                    ].map(([label, day]) => {
                      const active = activeWeekdays.includes(day as number);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() =>
                            setActiveWeekdays((current) =>
                              active ? current.filter((item) => item !== day) : [...current, day as number]
                            )
                          }
                          className={`grid size-10 place-items-center rounded-full border text-xs font-semibold ${
                            active ? "border-primary bg-primary text-white shadow-lg shadow-primary/20" : "border-border bg-background text-subtext"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm text-subtext">Horarios</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={selectedTime}
                        onChange={(event) => setSelectedTime(event.target.value)}
                        className="h-8 rounded-card border border-border bg-background px-2 text-xs outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={addScheduleTime}
                        className="grid size-8 place-items-center rounded-full border border-primary/50 bg-primary/10 text-primary"
                        title="Adicionar horario"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {scheduleTimes.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => removeScheduleTime(time)}
                        className="rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold hover:border-danger/60 hover:text-danger"
                        title="Remover horario"
                      >
                        {time.replace(":", " : ")}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="block text-sm">
                  <span className="mb-2 block text-subtext">Legenda padrao</span>
                  <textarea
                    value={caption}
                    onChange={(event) => setCaption(event.target.value)}
                    placeholder="Legenda base..."
                    className="min-h-24 w-full rounded-card border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                  />
                  <span className="mt-1 block text-right text-xs text-subtext">{caption.length}/2200</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCaptionMode("single")}
                    className={`rounded-card border px-3 py-2 text-xs font-semibold ${
                      captionMode === "single" ? "border-primary bg-primary text-white" : "border-border bg-background text-subtext"
                    }`}
                  >
                    Legenda unica
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaptionMode("csv")}
                    className={`rounded-card border px-3 py-2 text-xs font-semibold ${
                      captionMode === "csv" ? "border-primary bg-primary text-white" : "border-border bg-background text-subtext"
                    }`}
                  >
                    Legendas por arquivo
                  </button>
                  <button
                    type="button"
                    onClick={improveCaption}
                    className="rounded-card border border-border bg-background px-3 py-2 text-xs text-subtext hover:border-primary/60 hover:text-white"
                  >
                    <Sparkles size={13} className="mr-1 inline" /> Melhorar
                  </button>
                  <button
                    type="button"
                    onClick={summarizeCaption}
                    className="rounded-card border border-border bg-background px-3 py-2 text-xs text-subtext hover:border-primary/60 hover:text-white"
                  >
                    Resumir
                  </button>
                  <button
                    type="button"
                    onClick={addDefaultTags}
                    className="rounded-card border border-border bg-background px-3 py-2 text-xs text-subtext hover:border-primary/60 hover:text-white"
                  >
                    # Tags
                  </button>
                  <button
                    type="button"
                    onClick={applyCaptionToAllVideos}
                    className="rounded-card border border-border bg-background px-3 py-2 text-xs font-semibold text-subtext hover:border-primary/60 hover:text-white"
                  >
                    <Layers3 size={13} className="mr-1 inline" /> Aplicar a todos
                  </button>
                </div>
                <label className="flex items-center gap-2 text-xs text-subtext">
                  <input
                    type="checkbox"
                    checked={reviewConfirmed}
                    onChange={(event) => setReviewConfirmed(event.target.checked)}
                    className="size-4 accent-primary"
                  />
                  Confirmo que revisei conteudos, legendas e horarios.
                </label>
              </div>
            </ScheduleBlock>
          ) : null}

          {publishMessage ? (
            <div className={`rounded-card border p-3 text-sm ${publishMessage.tone === "success" ? "border-success/40 bg-success/10 text-success" : "border-warning/40 bg-warning/10 text-warning"}`}>
              {publishMessage.text}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => submitSchedule(mode === "rapid" ? "scheduled" : "published")}
            disabled={!canPublish || publishing}
            className="rounded-card bg-primary px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing ? "Enviando..." : mode === "rapid" ? "Agendar Tudo" : "Publicar Post"}
          </button>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
          <Panel title="Resumo do Post">
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-xs text-subtext">Perfil</span>
              <div className="flex min-w-0 items-center gap-2">
                <div className="size-5 rounded-full bg-pink-600" />
                <span className="truncate text-xs font-semibold">{summary.profile}</span>
              </div>
            </div>
            <SummaryRow label="Destinos" value={summary.destinationsLabel} />
            <SummaryRow label="" value={summary.selectedCountLabel} />
            <SummaryRow label="Tipo" value={summary.postTypeLabel} />
            <SummaryRow label="Midia" value={summary.mediaLabel} />
            <SummaryRow label="Inicio" value={preview?.startDate ?? summary.selectedDate} />
            <SummaryRow label="Fim" value={preview?.endDate ?? "-"} />
            <div className="mt-3 flex items-center gap-2 text-xs text-warning">
              <Clock size={14} /> {!destinations.length ? "Selecione destinos" : !mediaCount ? "Selecione midias" : !reviewConfirmed ? "Confirme a revisao" : "Pronto para publicar"}
            </div>
            <button
              type="button"
              onClick={() => submitSchedule(mode === "rapid" ? "scheduled" : "published")}
              disabled={!canPublish || publishing}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-card bg-primary px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishing ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={16} />}
              {publishing ? "Enviando..." : mode === "rapid" ? "Agendar Post" : "Confirmar Post"}
            </button>
            <button
              type="button"
              onClick={() => submitSchedule("published")}
              disabled={!canPublish || publishing}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-card border border-success/60 px-4 py-3 text-sm font-semibold text-success disabled:cursor-not-allowed disabled:opacity-50"
            >
              <UploadCloud size={16} />
              Publicar Agora
            </button>
          </Panel>

          <Panel title="Preview da Midia">
            {selectedMedia ? (
              <div className="rounded-card border border-border bg-background p-3">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs text-subtext">{medias.length} arquivo{medias.length > 1 ? "s" : ""}</span>
                  <Badge tone="neutral">{mode === "rapid" ? "Lote" : "Individual"}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="grid size-14 shrink-0 place-items-center rounded-card bg-white/5 text-primary">
                    {selectedMedia.filename.match(/\.(jpg|jpeg|png|webp)$/i) ? <ImageIcon size={22} /> : <FileVideo size={22} />}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{selectedMedia.filename}</div>
                    <div className="mt-1 text-xs text-subtext">{summary.mediaLabel}</div>
                  </div>
                </div>
                {mode === "rapid" ? (
                  <div className="mt-3 space-y-2">
                    <input
                      value={selectedMediaCaption}
                      onChange={(event) => updateSelectedMediaCaption(event.target.value)}
                      placeholder="Legenda deste post..."
                      className="h-10 w-full rounded-card border border-border bg-panel px-3 text-xs outline-none focus:border-primary"
                    />
                    <input
                      value={selectedMediaPublicUrl}
                      onChange={(event) => updateSelectedMediaPublicUrl(event.target.value)}
                      placeholder="URL da midia armazenada"
                      className="h-10 w-full rounded-card border border-border bg-panel px-3 text-xs outline-none focus:border-primary"
                    />
                  </div>
                ) : null}
              </div>
              ) : (
              <div className="grid min-h-44 place-items-center rounded-card border border-border bg-background text-center">
                <div>
                  <UploadCloud className="mx-auto mb-2 text-subtext" size={30} />
                  <div className="text-sm font-semibold">Faca upload da midia</div>
                  <div className="mt-1 text-xs text-subtext">Arraste um arquivo na area de upload</div>
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Dicas">
            <div className="space-y-2 text-xs text-subtext">
              <div>- Selecione ao menos 1 destino</div>
              <div>- Faca upload antes de agendar</div>
              <div>- Video vertical recomendado para Reels</div>
              <div>- Use Rapido para varios posts em lote</div>
            </div>
          </Panel>

          {mode === "rapid" && preview && preview.posts.length ? (
            <Panel title="Primeiros slots">
              <div className="space-y-2">
                {preview.posts.slice(0, 4).map((post) => (
                  <div key={`${post.mediaId}-${post.scheduledAt}`} className="rounded-card border border-border bg-background p-3 text-sm">
                    <div className="truncate">{post.filename}</div>
                    <div className="mt-1 text-xs text-subtext">{post.scheduledAt.replace("T", " ").slice(0, 16)}</div>
                  </div>
                ))}
              </div>
            </Panel>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function CalendarView({
  profileList,
  posts,
  onUpdatePost,
  onDeletePost
}: {
  profileList: ProfileSummary[];
  posts: DashboardRecentPost[];
  onUpdatePost: (postId: string, changes: { scheduledAt: string; caption: string }) => void;
  onDeletePost: (postId: string) => void;
}) {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const profileStats = useMemo(() => buildCalendarProfileStats(profileList, posts), [profileList, posts]);
  const selectedProfileStats = profileStats.find((item) => item.profile.id === selectedProfileId);

  if (selectedProfileStats) {
    return (
      <CalendarProfileDetail
        stats={selectedProfileStats}
        posts={posts.filter((post) => post.profile === selectedProfileStats.profile.name)}
        onUpdatePost={onUpdatePost}
        onDeletePost={onDeletePost}
        onBack={() => setSelectedProfileId(null)}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Calendario</h2>
        <p className="mt-1 text-sm text-subtext">Selecione um profile para ver o calendario de publicacoes</p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers3 size={16} className="text-primary" />
          <h3 className="text-sm font-semibold">Profiles V2 ({profileList.length})</h3>
          <span className="rounded-card bg-white/5 px-2 py-1 text-[10px] text-subtext">Late</span>
        </div>

        <div className="space-y-2">
          {profileStats.map(({ profile, pending, published, totalPosts }) => {
            const selected = selectedProfileId === profile.id;

            return (
              <button
                key={profile.id}
                type="button"
                onClick={() => setSelectedProfileId(profile.id)}
                className={`grid min-h-[70px] w-full gap-4 rounded-card border bg-panel p-4 text-left transition lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center ${
                  selected ? "border-primary/60" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <ProfileAvatar profile={profile} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="truncate text-sm font-semibold">{profile.name}</h4>
                      <CalendarProfileNetworkIcons accounts={profile.accounts} />
                    </div>
                    <p className="mt-1 text-xs text-subtext">
                      {profile.accounts.length} redes conectadas - {totalPosts} posts no total
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-self-end text-sm font-semibold">
                  <span className="text-warning">{pending} pendentes</span>
                  <span className="h-4 w-px bg-border" />
                  <span className="text-success">{published} publicados</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function buildCalendarProfileStats(profileList: ProfileSummary[], posts: DashboardRecentPost[]) {
  return profileList.map((profile) => {
    const profilePosts = posts.filter((post) => post.profile === profile.name);
    const pendingPosts = profilePosts.filter((post) => post.status === "scheduled" || post.status === "processing").length;
    const publishedPosts = profilePosts.filter((post) => post.status === "published").length;
    const pending = pendingPosts;
    const published = publishedPosts;

    return {
      profile,
      pending,
      published,
      totalPosts: profilePosts.length
    };
  });
}

function CalendarProfileNetworkIcons({ accounts }: { accounts: ProfileSummary["accounts"] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {accounts.map((account) => {
        const Icon = providerIcons[account.provider];
        const color = {
          instagram: "text-fuchsia-400",
          facebook: "text-sky-400",
          tiktok: "text-primary"
        }[account.provider];

        return <Icon key={account.provider} size={13} className={color} />;
      })}
    </span>
  );
}

function CalendarProfileDetail({
  stats,
  posts,
  onUpdatePost,
  onDeletePost,
  onBack
}: {
  stats: ReturnType<typeof buildCalendarProfileStats>[number];
  posts: DashboardRecentPost[];
  onUpdatePost: (postId: string, changes: { scheduledAt: string; caption: string }) => void;
  onDeletePost: (postId: string) => void;
  onBack: () => void;
}) {
  const [selectedDay, setSelectedDay] = useState<{ date: string; entries: CalendarProfileEntry[] } | null>(null);
  const currentMonth = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), monthIndex: now.getMonth() };
  }, []);
  const monthDays = useMemo(() => buildMonthDays(currentMonth.year, currentMonth.monthIndex), [currentMonth]);
  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat("pt-BR", {
        month: "long",
        year: "numeric",
        timeZone: calendarTimeZone
      }).format(new Date(currentMonth.year, currentMonth.monthIndex, 1)),
    [currentMonth]
  );
  const entriesByDate = useMemo(
    () => buildCalendarProfileEntries(stats.profile, posts, currentMonth.year, currentMonth.monthIndex),
    [currentMonth, posts, stats.profile]
  );
  const visibleEntryCount = useMemo(
    () => Array.from(entriesByDate.values()).reduce((total, entries) => total + entries.length, 0),
    [entriesByDate]
  );
  const publishedToday = posts.filter((post) => post.status === "published" && formatBrasiliaDateKey(post.scheduledAt) === formatBrasiliaDateKey(new Date().toISOString())).length;
  const errors = posts.filter((post) => post.status === "failed").length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm text-subtext hover:text-white">
            <ChevronLeft size={16} />
            Voltar
          </button>
          <ProfileAvatar profile={stats.profile} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold">{stats.profile.name}</h2>
              <span className="rounded-card bg-white/5 px-2 py-1 text-[10px] text-subtext">Late</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-subtext">
              <CalendarProfileNetworkIcons accounts={stats.profile.accounts} />
              <span>{stats.totalPosts} posts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CalendarMetric icon={Clock} tone="warning" value={stats.pending} label="Agendados" />
        <CalendarMetric icon={CheckCircle2} tone="success" value={publishedToday} label="Publicados Hoje" />
        <CalendarMetric icon={AlertTriangle} tone="danger" value={errors} label="Erros" />
        <CalendarMetric icon={Gauge} tone="primary" value={stats.published} label="Total Publicados" />
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-5">
            <button type="button" className="grid size-8 place-items-center rounded-card text-subtext hover:bg-white/5 hover:text-white">
              <ChevronLeft size={16} />
            </button>
            <div className="min-w-32 text-center text-base font-semibold capitalize">{monthTitle}</div>
            <button type="button" className="grid size-8 place-items-center rounded-card text-subtext hover:bg-white/5 hover:text-white">
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="rounded-card border border-border bg-panel p-1 text-xs">
            <button type="button" className="rounded-card bg-primary px-3 py-2 font-semibold">
              Posts Oficiais ({stats.totalPosts})
            </button>
            <button type="button" className="px-3 py-2 text-subtext">Reels de Teste (0)</button>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-subtext">
          {calendarLegend.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${item.className}`} />
              {item.label}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-subtext">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
            <div key={day} className="py-2">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {monthDays.map((day, index) => {
            const dayEntries = day ? entriesByDate.get(day.isoDate) ?? [] : [];
            const visibleEntries = dayEntries.slice(0, 4);
            const hiddenEntries = Math.max(dayEntries.length - visibleEntries.length, 0);

            return (
              <div
                key={day?.isoDate ?? `blank-${index}`}
                className={`min-h-28 rounded-card border border-border bg-panel/70 p-2 ${day?.isHighlighted ? "ring-1 ring-primary/60" : ""}`}
              >
                {day ? (
                  <>
                    <div className={`mb-2 text-xs ${day.isHighlighted ? "font-bold text-primary" : "text-subtext"}`}>{day.day}</div>
                    <div className="space-y-1">
                      {visibleEntries.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => setSelectedDay({ date: day.isoDate, entries: dayEntries })}
                          className={`flex h-5 w-full items-center justify-between gap-2 rounded px-1.5 text-left text-[10px] ${calendarPostBg(entry.status)}`}
                        >
                          <span className="min-w-0 truncate">
                            <span className="font-semibold text-white">{entry.time}</span>{" "}
                            {providerEmoji(entry.provider)} {entry.username}
                          </span>
                          <span className={`size-1.5 shrink-0 rounded-full ${calendarDotClass(entry.status)}`} />
                        </button>
                      ))}
                      {hiddenEntries > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedDay({ date: day.isoDate, entries: dayEntries })}
                          className="text-left text-[10px] text-subtext hover:text-white"
                        >
                          +{hiddenEntries} mais
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>

        {visibleEntryCount === 0 ? (
          <div className="rounded-card border border-border bg-panel p-5 text-sm text-subtext">
            Nenhuma postagem real agendada ou publicada para este perfil neste mes.
          </div>
        ) : null}
      </section>

      {selectedDay ? (
        <CalendarDayPostsDialog
          date={selectedDay.date}
          entries={selectedDay.entries}
          onUpdatePost={onUpdatePost}
          onDeletePost={onDeletePost}
          onClose={() => setSelectedDay(null)}
        />
      ) : null}
    </div>
  );
}

type CalendarProfileEntry = {
  id: string;
  time: string;
  provider: SocialProvider;
  username: string;
  status: CalendarPostStatus;
  filename: string;
  caption: string;
  type: DashboardRecentPost["type"];
};

function CalendarDayPostsDialog({
  date,
  entries,
  onUpdatePost,
  onDeletePost,
  onClose
}: {
  date: string;
  entries: CalendarProfileEntry[];
  onUpdatePost: (postId: string, changes: { scheduledAt: string; caption: string }) => void;
  onDeletePost: (postId: string) => void;
  onClose: () => void;
}) {
  const [editingEntry, setEditingEntry] = useState<{ id: string; time: string; caption: string } | null>(null);
  const sortedEntries = [...entries].sort((first, second) => first.time.localeCompare(second.time));

  const saveEdit = () => {
    if (!editingEntry) {
      return;
    }

    onUpdatePost(editingEntry.id, {
      scheduledAt: new Date(`${date}T${editingEntry.time}:00-03:00`).toISOString(),
      caption: editingEntry.caption
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-card border border-border bg-panel shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h3 className="text-lg font-semibold">{formatBrasiliaDateTitle(date)}</h3>
            <p className="mt-1 text-xs text-subtext">
              {sortedEntries.length} post{sortedEntries.length === 1 ? "" : "s"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-card text-subtext hover:bg-white/5 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[76vh] space-y-3 overflow-y-auto p-4">
          {sortedEntries.map((entry) => {
            const editable = entry.status === "scheduled" || entry.status === "processing" || entry.status === "pending";
            const isEditing = editingEntry?.id === entry.id;

            return (
              <article key={entry.id} className="grid gap-3 rounded-card border border-border bg-background p-4 sm:grid-cols-[24px_72px_minmax(0,1fr)_auto]">
                <div className="hidden pt-6 text-subtext sm:block">
                  <GripVertical size={16} />
                </div>
                <div className="grid size-16 place-items-center rounded-card bg-white/10 text-primary">
                  {entry.type === "feed" ? <ImageIcon size={24} /> : <FileVideo size={24} />}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <FileVideo size={14} className="text-primary" />
                    <span className="truncate text-sm font-semibold">{entry.filename}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-subtext">
                      <Clock size={12} /> {entry.time}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-10 font-semibold text-white">{entry.time}</span>
                      <span>{providerEmoji(entry.provider)}</span>
                      <span className="font-semibold">{entry.username}</span>
                      <Badge tone={entry.status === "published" ? "success" : entry.status === "failed" ? "danger" : "warning"}>
                        {calendarStatusLabel(entry.status)}
                      </Badge>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-3 space-y-2">
                      <input
                        type="time"
                        value={editingEntry.time}
                        onChange={(event) => setEditingEntry((current) => (current ? { ...current, time: event.target.value } : current))}
                        className="h-9 rounded-card border border-border bg-panel px-3 text-xs outline-none focus:border-primary"
                      />
                      <textarea
                        value={editingEntry.caption}
                        onChange={(event) => setEditingEntry((current) => (current ? { ...current, caption: event.target.value } : current))}
                        rows={3}
                        className="w-full rounded-card border border-border bg-panel px-3 py-2 text-xs outline-none focus:border-primary"
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={saveEdit} className="rounded-card bg-primary px-3 py-2 text-xs font-semibold">
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingEntry(null)}
                          className="rounded-card border border-border px-3 py-2 text-xs text-subtext hover:text-white"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-subtext">{entry.caption || "Sem legenda cadastrada."}</p>
                  )}
                </div>

                <div className="flex items-start gap-2 sm:flex-col">
                  <button
                    type="button"
                    disabled={!editable}
                    title={editable ? "Editar postagem" : "Somente posts agendados podem ser editados"}
                    onClick={() => setEditingEntry({ id: entry.id, time: entry.time, caption: entry.caption })}
                    className="grid size-8 place-items-center rounded-card text-subtext hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    disabled={!editable}
                    title={editable ? "Excluir postagem" : "Somente posts agendados podem ser excluidos"}
                    onClick={() => {
                      onDeletePost(entry.id);
                      onClose();
                    }}
                    className="grid size-8 place-items-center rounded-card text-subtext hover:bg-white/5 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function buildCalendarProfileEntries(profile: ProfileSummary, posts: DashboardRecentPost[], year: number, monthIndex: number) {
  const entriesByDate = new Map<string, CalendarProfileEntry[]>();

  posts.forEach((post) => {
    const date = formatBrasiliaDateKey(post.scheduledAt);
    const postDate = new Date(`${date}T12:00:00-03:00`);

    if (postDate.getFullYear() !== year || postDate.getMonth() !== monthIndex) {
      return;
    }

    const account = calendarAccountForPost(profile, post);
    const current = entriesByDate.get(date) ?? [];

    current.push({
      id: post.id,
      time: formatBrasiliaTime(post.scheduledAt),
      provider: account.provider,
      username: account.username,
      status: calendarStatusFromDashboard(post.status),
      filename: post.filename,
      caption: post.caption,
      type: post.type
    });
    entriesByDate.set(date, current);
  });

  entriesByDate.forEach((entries) => entries.sort((first, second) => first.time.localeCompare(second.time)));

  return entriesByDate;
}

function calendarAccountForPost(profile: ProfileSummary, post: DashboardRecentPost) {
  return (
    profile.accounts.find((account) => sameCalendarProfile(account.username, post.profile)) ??
    profile.accounts[0] ?? {
      provider: "instagram" as SocialProvider,
      username: post.profile,
      status: "active" as const
    }
  );
}

function sameCalendarProfile(first: string, second: string) {
  const normalizedFirst = first.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const normalizedSecond = second.toLowerCase().replace(/[^a-z0-9]+/g, "");

  return Boolean(
    normalizedFirst &&
      normalizedSecond &&
      (normalizedFirst === normalizedSecond || normalizedFirst.includes(normalizedSecond) || normalizedSecond.includes(normalizedFirst))
  );
}

function CalendarMetric({
  icon: Icon,
  tone,
  value,
  label
}: {
  icon: React.ElementType;
  tone: "primary" | "success" | "warning" | "danger";
  value: number;
  label: string;
}) {
  const toneClass = {
    primary: "bg-primary/20 text-primary",
    success: "bg-success/20 text-success",
    warning: "bg-warning/20 text-warning",
    danger: "bg-danger/20 text-danger"
  }[tone];

  return (
    <div className="rounded-card border border-border bg-panel p-5">
      <div className={`grid size-9 place-items-center rounded-card ${toneClass}`}>
        <Icon size={17} />
      </div>
      <div className="mt-5 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-subtext">{label}</div>
    </div>
  );
}

function CalendarPostDialog({
  date,
  posts,
  onClose
}: {
  date: string;
  posts: CalendarScheduledPost[];
  onClose: () => void;
}) {
  const publishedCount = posts.flatMap((post) => post.destinations).filter((destination) => destination.status === "published").length;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm">
      <section className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-card border border-border bg-panel shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h3 className="text-lg font-semibold">{formatBrasiliaDateTitle(date)}</h3>
            <div className="mt-1 flex gap-3 text-xs">
              <span className="text-subtext">{posts.length} posts</span>
              <span className="text-success">{publishedCount} publicados</span>
            </div>
          </div>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-card text-subtext hover:bg-white/5 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[72vh] space-y-4 overflow-y-auto p-5">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              className="grid w-full gap-4 rounded-card border border-success/40 bg-background p-4 text-left transition hover:border-primary/70 sm:grid-cols-[76px_1fr]"
            >
              <div className="grid size-16 place-items-center rounded-card bg-white/10 text-primary">
                <FileVideo size={22} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-primary">▦</span>
                  <span className="font-semibold">{post.filename}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-subtext">
                    <Clock size={12} /> {formatBrasiliaTime(post.scheduledAt)}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {post.destinations.map((destination) => (
                    <div key={`${post.id}-${destination.provider}`} className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="w-10 font-semibold text-white">{formatBrasiliaTime(post.scheduledAt)}</span>
                      <span>{providerEmoji(destination.provider)}</span>
                      <span className="font-semibold">{destination.username}</span>
                      <Badge tone={destination.status === "published" ? "success" : destination.status === "failed" ? "danger" : "warning"}>
                        {calendarStatusLabel(destination.status)}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-subtext">{post.caption}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function buildMonthDays(year: number, monthIndex: number) {
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: Array<{ day: number; isoDate: string; isHighlighted: boolean } | null> = [];

  for (let index = 0; index < firstDay.getDay(); index += 1) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      isoDate: `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
      isHighlighted: day === 4
    });
  }

  return cells;
}

function groupCalendarPostsByDate(posts: CalendarScheduledPost[]) {
  return posts.reduce((groups, post) => {
    const current = groups.get(post.date) ?? [];
    current.push(post);
    groups.set(post.date, current);
    return groups;
  }, new Map<string, CalendarScheduledPost[]>());
}

function buildCalendarPostsFromRecentPosts(posts: DashboardRecentPost[]): CalendarScheduledPost[] {
  return posts
    .map((post) => ({
      id: post.id,
      date: formatBrasiliaDateKey(post.scheduledAt),
      filename: post.filename,
      scheduledAt: post.scheduledAt,
      status: calendarStatusFromDashboard(post.status),
      caption: post.caption,
      destinations: [
        {
          provider: "instagram" as SocialProvider,
          username: post.profile,
          status: calendarStatusFromDashboard(post.status)
        }
      ]
    }))
    .sort((first, second) => first.scheduledAt.localeCompare(second.scheduledAt));
}

function buildCalendarCounters(posts: CalendarScheduledPost[]) {
  const today = formatBrasiliaDateKey(new Date().toISOString());

  return {
    scheduled: posts.filter((post) => post.status === "scheduled").length,
    publishedToday: posts.filter((post) => post.status === "published" && post.date === today).length,
    errors: posts.filter((post) => post.status === "failed").length,
    totalPublished: posts.filter((post) => post.status === "published").length
  };
}

function calendarStatusFromDashboard(status: DashboardPostStatus): CalendarPostStatus {
  return status;
}

function formatBrasiliaDateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: calendarTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(value));
}

function formatBrasiliaTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: calendarTimeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(value));
}

function formatBrasiliaDateTitle(date: string) {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    timeZone: calendarTimeZone,
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date(`${date}T12:00:00-03:00`));

  return formatted
    .split(" ")
    .map((part) => (part.length > 2 ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(" ");
}

function calendarDotClass(status: CalendarPostStatus) {
  return {
    scheduled: "bg-warning",
    pending: "bg-amber-400",
    queue: "bg-orange-500",
    processing: "bg-blue-500",
    published: "bg-success",
    partial: "bg-yellow-500",
    failed: "bg-danger",
    retrying: "bg-orange-400"
  }[status];
}

function calendarPostBg(status: CalendarPostStatus) {
  return status === "published"
    ? "bg-success/15 text-success"
    : status === "processing"
      ? "bg-blue-500/10 text-blue-300"
      : status === "failed"
        ? "bg-danger/10 text-danger"
        : "bg-white/[0.03] text-subtext";
}

function calendarStatusLabel(status: CalendarPostStatus) {
  return {
    scheduled: "Agendado",
    pending: "Pendente",
    queue: "Na fila",
    processing: "Processando",
    published: "Publicado",
    partial: "Parcial",
    failed: "Erro",
    retrying: "Tentando"
  }[status];
}

function providerEmoji(provider: SocialProvider) {
  return {
    instagram: "IG",
    facebook: "FB",
    tiktok: "TT"
  }[provider];
}

type ZernioConnectionState = {
  profile: ProfileSummary;
  provider: SocialProvider;
  setConnectingKey: React.Dispatch<React.SetStateAction<string | null>>;
  setZernioMessage: React.Dispatch<React.SetStateAction<string>>;
  setProfileList: React.Dispatch<React.SetStateAction<ProfileSummary[]>>;
};

async function startZernioConnection({
  profile,
  provider,
  setConnectingKey,
  setZernioMessage,
  setProfileList
}: ZernioConnectionState) {
  setZernioMessage("");
  setConnectingKey(`${profile.id}:${provider}`);

  const popup = window.open("", "fastpost-zernio-connect", "width=760,height=840");
  let response: Response;
  let payload: { error?: string; data?: { authUrl?: string; zernioProfileId?: string } };

  try {
    response = await fetch("/api/zernio/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        localProfileId: profile.id,
        profileName: profile.name,
        zernioProfileId: profile.zernioProfileId,
        platform: provider
      })
    });
    payload = await response.json();
  } catch {
    popup?.close();
    setConnectingKey(null);
    setZernioMessage("Nao foi possivel iniciar a conexao pela Zernio.");
    return;
  }

  if (!response.ok) {
    popup?.close();
    setConnectingKey(null);
    setZernioMessage(payload.error ?? "Nao foi possivel iniciar a conexao pela Zernio.");
    return;
  }

  const zernioProfileId = payload.data?.zernioProfileId;
  const authUrl = payload.data?.authUrl;

  if (!zernioProfileId || !authUrl) {
    popup?.close();
    setConnectingKey(null);
    setZernioMessage("A Zernio nao retornou os dados de conexao.");
    return;
  }
  const syncedProfile = {
    ...profile,
    zernioProfileId
  };

  setProfileList((current) =>
    current.map((item) =>
      item.id === profile.id
        ? {
            ...item,
            zernioProfileId
          }
        : item
    )
  );

  if (!popup) {
    setConnectingKey(null);
    setZernioMessage("O navegador bloqueou a janela da Zernio. Libere pop-ups para conectar a rede.");
    return;
  }

  popup.location.href = authUrl;
  setZernioMessage(
    provider === "facebook"
      ? "Conclua a janela da Zernio e escolha a pagina do Facebook. Quando a pagina aparecer como conectada, a janela sera fechada automaticamente."
      : "Conclua a janela da Zernio. Quando a conta aparecer como conectada, a janela sera fechada automaticamente."
  );

  monitorZernioConnection({
    popup,
    profile: syncedProfile,
    provider,
    onConnected: (accounts) => {
      setProfileList((current) =>
        current.map((item) =>
          item.id === profile.id
            ? {
                ...item,
                zernioProfileId,
                accounts
              }
            : item
        )
      );
      setConnectingKey(null);
      setZernioMessage(`${provider} conectado ao perfil ${profile.name}.`);
    }
  });
}

function monitorZernioConnection({
  popup,
  profile,
  provider,
  onConnected
}: {
  popup: Window;
  profile: ProfileSummary;
  provider: SocialProvider;
  onConnected: (accounts: ProfileSummary["accounts"]) => void;
}) {
  let attempts = 0;

  const interval = window.setInterval(() => {
    attempts += 1;

    void (async () => {
      const syncedAccounts = await readZernioAccountsForProfile(profile);
      const connected = syncedAccounts.some((account) => account.provider === provider);

      if (connected) {
        window.clearInterval(interval);
        popup.close();
        onConnected(syncedAccounts);
        return;
      }

      if (!popup.closed && attempts < 60) {
        return;
      }

      window.clearInterval(interval);
      onConnected(ensureProviderAccount(profile.accounts, profile, provider));
    })();
  }, 2000);

}

async function readZernioAccountsForProfile(profile: ProfileSummary) {
  try {
    const response = await fetch(`/api/zernio/accounts?profileId=${encodeURIComponent(profile.id)}`);
    const payload = await response.json();

    if (response.ok) {
      return mapZernioAccountsForProfile(payload.data, profile);
    }
  } catch {
    return profile.accounts;
  }

  return profile.accounts;
}

function ensureProviderAccount(accounts: ProfileSummary["accounts"], profile: ProfileSummary, provider: SocialProvider) {
  if (accounts.some((account) => account.provider === provider)) {
    return accounts;
  }

  return [
    ...accounts,
    {
      provider,
      username: accountLabelFor(profile.name, provider),
      status: "active" as const
    }
  ];
}

function ProfilesView({
  profileList,
  setProfileList
}: {
  profileList: ProfileSummary[];
  setProfileList: React.Dispatch<React.SetStateAction<ProfileSummary[]>>;
}) {
  const [creating, setCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newProfileNetworks, setNewProfileNetworks] = useState<SocialProvider[]>([]);
  const [editingNetworksFor, setEditingNetworksFor] = useState<string | null>(null);
  const [connectingKey, setConnectingKey] = useState<string | null>(null);
  const [zernioMessage, setZernioMessage] = useState("");

  const createProfile = async () => {
    const trimmedName = newProfileName.trim();

    if (!trimmedName) {
      return;
    }

    const profile: ProfileSummary = {
      id: `profile-${Date.now()}`,
      name: trimmedName,
      description: "Perfil criado para conectar canais sociais.",
      avatar: initialsFor(trimmedName),
      queueRemaining: 0,
      queueDays: 0,
      slots: [
        { hour: 9, minute: 0, active: true },
        { hour: 15, minute: 0, active: true },
        { hour: 20, minute: 0, active: true }
      ],
      accounts: []
    };

    setProfileList((current) => [
      ...current,
      profile
    ]);
    setNewProfileName("");
    setNewProfileNetworks([]);
    setCreating(false);

    if (newProfileNetworks[0]) {
      await startZernioConnection({
        profile,
        provider: newProfileNetworks[0],
        setConnectingKey,
        setZernioMessage,
        setProfileList
      });
    }
  };

  const toggleNewNetwork = (provider: SocialProvider) => {
    setNewProfileNetworks((current) => (current.includes(provider) ? [] : [provider]));
  };

  const disconnectLocalAccount = (profileId: string, provider: SocialProvider) => {
    setProfileList((current) =>
      current.map((profile) =>
        profile.id === profileId
          ? {
              ...profile,
              accounts: profile.accounts.filter((item) => item.provider !== provider)
            }
          : profile
      )
    );
  };

  const connectWithZernio = async (profile: ProfileSummary, provider: SocialProvider) => {
    const connected = profile.accounts.some((account) => account.provider === provider);

    if (connected) {
      disconnectLocalAccount(profile.id, provider);
      return;
    }

    await startZernioConnection({
      profile,
      provider,
      setConnectingKey,
      setZernioMessage,
      setProfileList
    });
  };

  const removeProfile = (profileId: string) => {
    setProfileList((current) => current.filter((profile) => profile.id !== profileId));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Contas sociais</h2>
          <p className="mt-1 text-sm text-subtext">Conecte e gerencie suas redes sociais</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-card bg-primary px-4 py-2.5 text-sm font-semibold"
        >
          <Plus size={16} /> Criar Profile
        </button>
      </div>

      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-subtext">
          <span>Canais sociais</span>
          <span className="rounded-full bg-primary/20 px-2 py-0.5 text-primary">{profileList.length}</span>
        </div>
        <p className="mt-2 text-xs text-subtext">Gerencie multiplas contas sociais</p>
      </div>

      {creating ? (
        <div className="rounded-card border border-border bg-panel p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
            <input
              value={newProfileName}
              onChange={(event) => setNewProfileName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  createProfile();
                }
              }}
              autoFocus
              placeholder="Nome do perfil"
              className="h-11 rounded-card border border-primary bg-background px-3 outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {(["instagram", "facebook", "tiktok"] as SocialProvider[]).map((provider) => {
                const Icon = providerIcons[provider];
                const active = newProfileNetworks.includes(provider);

                return (
                  <button
                    key={provider}
                    onClick={() => toggleNewNetwork(provider)}
                    className={`inline-flex h-11 items-center gap-2 rounded-card border px-3 text-sm capitalize ${
                      active ? "border-primary bg-primary/20 text-white" : "border-border bg-background text-subtext"
                    }`}
                  >
                    <Icon size={16} /> {provider}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button onClick={createProfile} className="h-11 rounded-card bg-primary px-5 text-sm font-semibold">
                Criar
              </button>
              <button onClick={() => setCreating(false)} className="h-11 rounded-card bg-background px-5 text-sm font-semibold text-subtext">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {zernioMessage ? (
        <div className="rounded-card border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          {zernioMessage}
        </div>
      ) : null}

      <div className="space-y-3">
        {profileList.map((profile) => (
          <div key={profile.id} className="rounded-card border border-border bg-panel p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-11 shrink-0 place-items-center rounded-card bg-primary text-xs font-bold">
                  {profile.avatar}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-semibold">{profile.name}</div>
                  <div className="text-sm text-subtext">{profile.accounts.length} conta(s) conectada(s)</div>
                </div>
                <button
                  onClick={() => setEditingNetworksFor(editingNetworksFor === profile.id ? null : profile.id)}
                  className="ml-2 text-xs text-primary"
                >
                  Clique para conectar redes sociais
                </button>
              </div>

              <div className="flex items-center gap-3 text-subtext">
                <div className="hidden flex-wrap gap-2 md:flex">
                  {profile.accounts.map((account) => {
                    const Icon = providerIcons[account.provider];

                    return (
                      <span key={account.provider} className="inline-flex items-center gap-1 rounded-card border border-border bg-background px-2 py-1 text-xs capitalize">
                        <Icon size={13} /> {account.provider}
                      </span>
                    );
                  })}
                </div>
                <button title="Sincronizar" className="grid size-9 place-items-center rounded-card hover:bg-white/5">
                  <RefreshCw size={16} />
                </button>
                <button onClick={() => removeProfile(profile.id)} title="Excluir" className="grid size-9 place-items-center rounded-card hover:bg-white/5">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {editingNetworksFor === profile.id ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                {(["instagram", "facebook", "tiktok"] as SocialProvider[]).map((provider) => {
                  const Icon = providerIcons[provider];
                  const active = profile.accounts.some((account) => account.provider === provider);

                  return (
                    <button
                      key={provider}
                      onClick={() => connectWithZernio(profile, provider)}
                      className={`inline-flex items-center gap-2 rounded-card border px-3 py-2 text-sm capitalize ${
                        active ? "border-primary bg-primary/20 text-white" : "border-border bg-background text-subtext"
                      }`}
                    >
                      {connectingKey === `${profile.id}:${provider}` ? <Loader2 size={16} className="animate-spin" /> : <Icon size={16} />}
                      {provider}
                      {active ? <CheckCircle2 size={14} className="text-success" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountsView({
  profileList,
  setProfileList
}: {
  profileList: ProfileSummary[];
  setProfileList: React.Dispatch<React.SetStateAction<ProfileSummary[]>>;
}) {
  const [creating, setCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [connectingKey, setConnectingKey] = useState<string | null>(null);
  const [zernioMessage, setZernioMessage] = useState("");
  const [expandedProfileIds, setExpandedProfileIds] = useState<string[]>([]);

  const createProfile = () => {
    const trimmedName = newProfileName.trim();

    if (!trimmedName) {
      return;
    }

    const newProfileId = `profile-${Date.now()}`;

    setProfileList((current) => [
      ...current,
      {
        id: newProfileId,
        name: trimmedName,
        description: "Perfil criado para conectar canais sociais.",
        avatar: initialsFor(trimmedName),
        queueRemaining: 0,
        queueDays: 0,
        slots: [
          { hour: 9, minute: 0, active: true },
          { hour: 15, minute: 0, active: true },
          { hour: 20, minute: 0, active: true }
        ],
        accounts: []
      }
    ]);
    setExpandedProfileIds((current) => [...current, newProfileId]);
    setNewProfileName("");
    setCreating(false);
  };

  const disconnectLocalAccount = async (profileId: string, provider: SocialProvider) => {
    const profile = profileList.find((item) => item.id === profileId);
    setProfileList((current) =>
      current.map((profile) =>
        profile.id === profileId
          ? {
              ...profile,
              accounts: profile.accounts.filter((item) => item.provider !== provider)
            }
          : profile
      )
    );

    if (profile) {
      await fetch("/api/notifications/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "account_disconnected",
          profileName: profile.name,
          provider,
          message: `${provider} foi desconectado do perfil ${profile.name}.`
        })
      });
    }
  };

  const connectWithZernio = async (profile: ProfileSummary, provider: SocialProvider) => {
    const connected = profile.accounts.some((account) => account.provider === provider);

    if (connected) {
      disconnectLocalAccount(profile.id, provider);
      return;
    }

    await startZernioConnection({
      profile,
      provider,
      setConnectingKey,
      setZernioMessage,
      setProfileList
    });
  };

  const syncProfileAccounts = async (profile: ProfileSummary) => {
    setZernioMessage("");
    setConnectingKey(`${profile.id}:sync`);

    const response = await fetch(`/api/zernio/accounts?profileId=${encodeURIComponent(profile.id)}`);
    const payload = await response.json();
    setConnectingKey(null);

    if (!response.ok) {
      setZernioMessage(payload.error ?? "Nao foi possivel sincronizar contas da Zernio.");
      return;
    }

    const accounts = mapZernioAccountsForProfile(payload.data, profile);

    setProfileList((current) =>
      current.map((item) =>
        item.id === profile.id
          ? {
              ...item,
              accounts
            }
          : item
      )
    );
  };

  const removeProfile = (profileId: string) => {
    setProfileList((current) => current.filter((profile) => profile.id !== profileId));
    setExpandedProfileIds((current) => current.filter((id) => id !== profileId));
  };

  const toggleProfileDetails = (profileId: string) => {
    setExpandedProfileIds((current) =>
      current.includes(profileId) ? current.filter((id) => id !== profileId) : [...current, profileId]
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Contas sociais</h2>
          <p className="mt-1 text-sm text-subtext">Conecte e gerencie suas redes sociais</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-subtext">
            <span>Canais sociais</span>
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-primary">{profileList.length}</span>
          </div>
          <p className="mt-2 text-xs text-subtext">Gerencie multiplas contas sociais</p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex h-9 items-center gap-2 rounded-card bg-primary px-4 text-xs font-semibold"
        >
          <Plus size={14} /> Criar Profile
        </button>
      </div>

      {creating ? (
        <div className="rounded-card border border-border bg-panel p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <input
              value={newProfileName}
              onChange={(event) => setNewProfileName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  createProfile();
                }
              }}
              autoFocus
              placeholder="Nome do perfil"
              className="h-11 rounded-card border border-primary bg-background px-3 outline-none"
            />
            <div className="flex gap-2">
              <button onClick={createProfile} className="h-11 rounded-card bg-primary px-5 text-sm font-semibold">
                Criar
              </button>
              <button onClick={() => setCreating(false)} className="h-11 rounded-card bg-background px-5 text-sm font-semibold text-subtext">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {zernioMessage ? (
        <div className="rounded-card border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
          {zernioMessage}
        </div>
      ) : null}

      <div className="space-y-3">
        {profileList.map((profile) => {
          const expanded = expandedProfileIds.includes(profile.id);
          const detailsId = `account-profile-details-${profile.id}`;

          return (
            <section key={profile.id} className={`rounded-card border bg-panel ${expanded ? "border-primary/60" : "border-border"}`}>
              <div className="grid min-h-[74px] gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="flex min-w-0 items-center gap-3">
                  <ProfileAvatar profile={profile} />
                  <div className="grid min-w-0 gap-1 sm:grid-cols-[minmax(0,130px)_auto] sm:items-center sm:gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold">{profile.name}</h3>
                      <p className="text-sm text-subtext">{profile.accounts.length} conta(s) conectada(s)</p>
                    </div>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={detailsId}
                      onClick={() => toggleProfileDetails(profile.id)}
                      className="w-fit text-left text-xs font-medium text-primary hover:text-white"
                    >
                      Clique para conectar redes sociais
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-5 justify-self-end text-subtext">
                  <button
                    type="button"
                    title="Sincronizar"
                    onClick={() => syncProfileAccounts(profile)}
                    className="grid size-8 place-items-center rounded-card hover:bg-white/5 hover:text-white"
                  >
                    <RefreshCw size={16} className={connectingKey === `${profile.id}:sync` ? "animate-spin" : ""} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProfile(profile.id)}
                    title="Excluir"
                    className="grid size-8 place-items-center rounded-card hover:bg-white/5 hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {expanded ? (
                <div id={detailsId} className="border-t border-border p-4">
                  <div>
                    <div className="mb-3 text-xs uppercase tracking-wider text-subtext">Conectar plataforma</div>
                    <div className="grid gap-2 md:grid-cols-3">
                      {(["instagram", "facebook", "tiktok"] as SocialProvider[]).map((provider) => {
                        const account = profile.accounts.find((item) => item.provider === provider);
                        const Icon = providerIcons[provider];

                        return (
                          <button
                            key={provider}
                            type="button"
                            onClick={() => connectWithZernio(profile, provider)}
                            className={`inline-flex h-9 items-center justify-center gap-2 rounded-card border px-3 text-xs capitalize ${
                              account
                                ? "border-success/60 bg-success/15 text-success"
                                : "border-border bg-background text-subtext hover:border-primary/60 hover:text-white"
                            }`}
                          >
                            {connectingKey === `${profile.id}:${provider}` ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : account ? (
                              <CheckCircle2 size={13} />
                            ) : (
                              <Plus size={13} className="text-primary" />
                            )}
                            <Icon size={13} />
                            {provider}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-3 text-xs uppercase tracking-wider text-subtext">Contas conectadas</div>
                    {profile.accounts.length === 0 ? (
                      <div className="rounded-card border border-border bg-background p-4 text-sm text-subtext">
                        Nenhuma rede conectada neste perfil.
                      </div>
                    ) : (
                      <div className="grid gap-2">
                        {profile.accounts.map((account) => {
                          const Icon = providerIcons[account.provider];
                          const statusTone = account.status === "active" ? "success" : account.status === "expired" ? "warning" : "danger";
                          const statusLabel = account.status === "active" ? "Ativo" : account.status === "expired" ? "Expirado" : "Erro";

                          return (
                            <div
                              key={account.provider}
                              className="grid gap-3 rounded-card bg-background p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <ProfileAccountAvatar profile={profile} account={account} fallbackIcon={Icon} />
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold">{account.username}</div>
                                  <div className="text-xs capitalize text-subtext">{account.provider}</div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between gap-3 sm:justify-end">
                                <Badge tone={statusTone}>{statusLabel}</Badge>
                                <button
                                  type="button"
                                  onClick={() => disconnectLocalAccount(profile.id, account.provider)}
                                  className="grid size-8 place-items-center rounded-card text-subtext hover:bg-white/5 hover:text-white"
                                  title="Desconectar"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ProfileAvatar({ profile }: { profile: ProfileSummary }) {
  const avatar = profile.avatar.trim();
  const isImageAvatar = /^(https?:|data:image\/|\/)/.test(avatar);
  const tones = ["bg-primary", "bg-fuchsia-600", "bg-indigo-700", "bg-zinc-900", "bg-amber-600"];
  const tone = tones[Math.abs(hashString(profile.id || profile.name)) % tones.length];

  if (isImageAvatar) {
    return (
      <img
        src={avatar}
        alt=""
        className="size-10 shrink-0 rounded-card border border-border object-cover"
      />
    );
  }

  return (
    <div className={`grid size-10 shrink-0 place-items-center rounded-card text-[10px] font-bold leading-none text-white ${tone}`}>
      {avatar || initialsFor(profile.name)}
    </div>
  );
}

function ProfileAccountAvatar({
  profile,
  account,
  fallbackIcon: FallbackIcon
}: {
  profile: ProfileSummary;
  account: ProfileSummary["accounts"][number];
  fallbackIcon: React.ElementType;
}) {
  const avatar = profile.avatar.trim();
  const isImageAvatar = /^(https?:|data:image\/|\/)/.test(avatar);

  if (isImageAvatar) {
    return (
      <img
        src={avatar}
        alt=""
        className="size-10 shrink-0 rounded-full border border-primary/30 object-cover"
      />
    );
  }

  return (
    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/20 text-primary">
      <FallbackIcon size={17} />
      <span className="sr-only">{account.provider}</span>
    </div>
  );
}

function hashString(value: string) {
  return value.split("").reduce((hash, char) => hash + char.charCodeAt(0), 0);
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function accountLabelFor(profileName: string, provider: SocialProvider) {
  if (provider === "facebook") {
    return profileName;
  }

  return `@${profileName.toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
}

async function notifyPublishedPost({
  profileName,
  filename,
  destinations,
  publishedUrl
}: {
  profileName: string;
  filename: string;
  destinations: SocialProvider[];
  publishedUrl?: string;
}) {
  if (!publishedUrl) {
    return;
  }

  await fetch("/api/notifications/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "post_success",
      profileName,
      provider: destinations.length ? destinations.map(providerLabel).join(", ") : undefined,
      postTitle: filename,
      publishedUrl,
      message: `Post publicado com sucesso em ${profileName}.`
    })
  }).catch(() => undefined);
}

function providerLabel(provider: SocialProvider) {
  return {
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok"
  }[provider];
}

function mapZernioAccountsForProfile(accounts: Array<Record<string, unknown>>, profile: ProfileSummary) {
  const mapped = accounts
    .filter((account) => {
      const profileId =
        stringField(account, "profileId") ??
        stringField(account, "profile_id") ??
        stringField(account, "profile") ??
        stringField(account, "profile_id");

      return !profile.zernioProfileId || !profileId || profileId === profile.zernioProfileId;
    })
    .map((account) => {
      const provider = normalizeProvider(stringField(account, "platform") ?? stringField(account, "provider"));

      if (!provider) {
        return null;
      }

      return {
        provider,
        username:
          stringField(account, "username") ??
          stringField(account, "name") ??
          stringField(account, "displayName") ??
          accountLabelFor(profile.name, provider),
        status: "active" as const,
        externalAccountId: stringField(account, "_id") ?? stringField(account, "id") ?? stringField(account, "accountId")
      };
    })
    .filter((account): account is NonNullable<typeof account> => Boolean(account));

  return mapped.length > 0 ? mapped : profile.accounts;
}

function stringField(source: Record<string, unknown>, key: string) {
  const value = source[key];

  return typeof value === "string" ? value : undefined;
}

function normalizeProvider(value?: string): SocialProvider | null {
  if (value === "instagram" || value === "facebook" || value === "tiktok") {
    return value;
  }

  return null;
}

function LogsView() {
  return (
    <Panel title="Logs operacionais">
      <div className="space-y-2">
        <div className="rounded-card border border-border bg-background p-4 text-sm text-subtext">
          Nenhum log real registrado ainda. Quando conectarmos persistencia de banco, publicacoes e falhas aparecem aqui.
        </div>
      </div>
    </Panel>
  );
}

function SettingsView({ profileList }: { profileList: ProfileSummary[] }) {
  const [runtime, setRuntime] = useState<{
    appUrl: string;
    nodeEnv: string;
    local: Array<{ name: string; configured: boolean }>;
    production: Array<{ name: string; configured: boolean }>;
    healthPath: string;
    zernioAccountsPath: string;
  } | null>(null);
  const [localSettings, setLocalSettings] = useState<{
    zernio: {
      mode: "global" | "profiles";
      hasGlobalApiKey: boolean;
      profileApiKeys: Record<string, boolean>;
    };
    env: Record<string, boolean>;
    notifications: {
      enabled: boolean;
      email: string;
      onPostSuccess: boolean;
      onAccountDisconnected: boolean;
    };
  } | null>(null);
  const [zernioMode, setZernioMode] = useState<"global" | "profiles">("global");
  const [globalZernioApiKey, setGlobalZernioApiKey] = useState("");
  const [profileZernioApiKeys, setProfileZernioApiKeys] = useState<Record<string, string>>({});
  const [showGlobalZernioApiKey, setShowGlobalZernioApiKey] = useState(false);
  const [visibleProfileApiKeys, setVisibleProfileApiKeys] = useState<Record<string, boolean>>({});
  const [envFields, setEnvFields] = useState<Record<string, string>>({});
  const [notificationSettings, setNotificationSettings] = useState({
    enabled: false,
    email: "",
    onPostSuccess: true,
    onAccountDisconnected: true
  });
  const [checking, setChecking] = useState(false);
  const [zernioCheck, setZernioCheck] = useState<{ ok: boolean; message: string } | null>(null);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");

  const refreshRuntime = async () => {
    setChecking(true);
    const [runtimeResponse, localResponse] = await Promise.all([
      fetch("/api/settings/runtime"),
      fetch("/api/settings/local")
    ]);
    const runtimePayload = await runtimeResponse.json();
    const localPayload = await localResponse.json();
    setRuntime(runtimePayload.data);
    setLocalSettings(localPayload.data);
    setZernioMode(localPayload.data.zernio.mode);
    setNotificationSettings(localPayload.data.notifications);
    setChecking(false);
  };

  const testZernio = async () => {
    setZernioCheck(null);
    setChecking(true);
    const profileIdForTest =
      zernioMode === "profiles"
        ? profileList.find((profile) => localSettings?.zernio.profileApiKeys[profile.id] || profileZernioApiKeys[profile.id])?.id
        : undefined;
    const response = await fetch(
      profileIdForTest
        ? `/api/zernio/accounts?profileId=${encodeURIComponent(profileIdForTest)}`
        : "/api/zernio/accounts"
    );
    const payload = await response.json();
    setChecking(false);

    setZernioCheck({
      ok: response.ok,
      message: response.ok
        ? `Zernio respondeu. ${Array.isArray(payload.data) ? payload.data.length : 0} conta(s) encontrada(s).`
        : payload.error ?? "Zernio nao respondeu."
    });
  };

  const saveLocalSettings = async () => {
    setSettingsMessage("");
    setChecking(true);
    const response = await fetch("/api/settings/local", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        env: envFields,
        zernio: {
          mode: zernioMode,
          globalApiKey: globalZernioApiKey,
          profileApiKeys: profileZernioApiKeys
        },
        notifications: notificationSettings
      })
    });
    const payload = await response.json();
    setChecking(false);

    if (!response.ok) {
      setSettingsMessage(payload.error ?? "Nao foi possivel salvar.");
      return;
    }

    setLocalSettings(payload.data);
    setGlobalZernioApiKey("");
    setProfileZernioApiKeys({});
    setEnvFields({});
    setSettingsMessage("Configurações salvas. A Zernio já pode ser usada nas conexões. Os campos avançados só serão necessários quando formos deixar rodando continuamente fora do localhost.");
    await refreshRuntime();
  };

  const testNotificationEmail = async () => {
    setNotificationMessage("");
    const response = await fetch("/api/notifications/test", { method: "POST" });
    const payload = await response.json();

    setNotificationMessage(
      response.ok && payload.data?.dryRun
        ? "Configuração salva, mas SMTP ainda não está configurado. O envio real será ativado ao preencher SMTP_HOST, SMTP_USER e SMTP_PASS."
        : response.ok && payload.ok
          ? "E-mail de teste processado."
          : payload.data?.reason ?? payload.error ?? "Não foi possível testar o e-mail."
    );
  };

  useEffect(() => {
    refreshRuntime();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Configurações</h2>
          <p className="mt-1 text-sm text-subtext">Ambiente local, Zernio e modo contínuo para uso pessoal.</p>
        </div>
        <button
          onClick={refreshRuntime}
          className="inline-flex items-center gap-2 rounded-card border border-border bg-panel px-4 py-2.5 text-sm text-subtext"
        >
          <RefreshCw size={16} className={checking ? "animate-spin" : ""} /> Reverificar
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Localhost agora">
          <SettingStatus
            label="URL local"
            value={runtime?.appUrl ?? "http://127.0.0.1:3000"}
            ok
          />
          <SettingStatus label="Healthcheck" value="/api/health" ok />
          <SettingCode command="start-fastpost.cmd" />
          <SettingCode command="http://127.0.0.1:3000" />
        </Panel>

        <Panel title="Zernio">
          <SettingStatus
            label="ZERNIO_API_KEY"
            value={zernioMode === "global" ? "API global para todos os perfis" : "API direcionada por perfil"}
            ok={Boolean(runtime?.local.find((item) => item.name === "ZERNIO_API_KEY")?.configured)}
          />
          <div className="mb-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => setZernioMode("global")}
              className={`rounded-card border px-3 py-2 text-sm ${zernioMode === "global" ? "border-primary bg-primary" : "border-border bg-background text-subtext"}`}
            >
              API global
            </button>
            <button
              onClick={() => setZernioMode("profiles")}
              className={`rounded-card border px-3 py-2 text-sm ${zernioMode === "profiles" ? "border-primary bg-primary" : "border-border bg-background text-subtext"}`}
            >
              Por perfil
            </button>
          </div>
          {zernioMode === "global" ? (
            <label className="block text-sm">
              <span className="mb-2 block text-subtext">
                API global da Zernio {localSettings?.zernio.hasGlobalApiKey ? "(salva)" : ""}
              </span>
              <div className="flex items-center rounded-card border border-border bg-background pr-2 focus-within:border-primary">
                <input
                  type={showGlobalZernioApiKey ? "text" : "password"}
                  value={globalZernioApiKey}
                  onChange={(event) => setGlobalZernioApiKey(event.target.value)}
                  placeholder={localSettings?.zernio.hasGlobalApiKey ? "Chave salva. Preencha apenas para trocar." : "Cole sua API key da Zernio"}
                  className="h-11 w-full bg-transparent px-3 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowGlobalZernioApiKey((current) => !current)}
                  className="grid size-9 place-items-center rounded-card text-subtext hover:text-white"
                  title={showGlobalZernioApiKey ? "Ocultar API" : "Mostrar API"}
                >
                  {showGlobalZernioApiKey ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>
          ) : (
            <div className="space-y-2">
              {profileList.map((profile) => (
                <label key={profile.id} className="block text-sm">
                  <span className="mb-1 block text-subtext">
                    {profile.name} {localSettings?.zernio.profileApiKeys[profile.id] ? "(API salva)" : ""}
                  </span>
                  <div className="flex items-center rounded-card border border-border bg-background pr-2 focus-within:border-primary">
                    <input
                      type={visibleProfileApiKeys[profile.id] ? "text" : "password"}
                      value={profileZernioApiKeys[profile.id] ?? ""}
                      onChange={(event) =>
                        setProfileZernioApiKeys((current) => ({
                          ...current,
                          [profile.id]: event.target.value
                        }))
                      }
                      placeholder={localSettings?.zernio.profileApiKeys[profile.id] ? "Chave salva. Preencha apenas para trocar." : "API key para este perfil"}
                      className="h-10 w-full bg-transparent px-3 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleProfileApiKeys((current) => ({
                          ...current,
                          [profile.id]: !current[profile.id]
                        }))
                      }
                      className="grid size-8 place-items-center rounded-card text-subtext hover:text-white"
                      title={visibleProfileApiKeys[profile.id] ? "Ocultar API" : "Mostrar API"}
                    >
                      {visibleProfileApiKeys[profile.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
              ))}
            </div>
          )}
          <button onClick={testZernio} className="mt-3 w-full rounded-card bg-primary px-4 py-2.5 text-sm font-semibold">
            Testar Zernio
          </button>
          {zernioCheck ? (
            <div className={`mt-3 rounded-card border p-3 text-sm ${zernioCheck.ok ? "border-success/40 bg-success/10 text-success" : "border-warning/40 bg-warning/10 text-warning"}`}>
              {zernioCheck.message}
            </div>
          ) : null}
          <div className="mt-4 text-xs text-subtext">
            Crie a chave em zernio.com. Você pode salvar globalmente ou direcionar para perfis específicos.
          </div>
        </Panel>

        <Panel title="Sessão e segurança">
          <SettingStatus
            label="FASTPOST_SESSION_SECRET"
            value="Assina o cookie de login"
            ok={Boolean(runtime?.local.find((item) => item.name === "FASTPOST_SESSION_SECRET")?.configured)}
          />
          {!runtime?.local.find((item) => item.name === "FASTPOST_SESSION_SECRET")?.configured ? (
            <input
              type="password"
              value={envFields.FASTPOST_SESSION_SECRET ?? ""}
              onChange={(event) =>
                setEnvFields((current) => ({
                  ...current,
                  FASTPOST_SESSION_SECRET: event.target.value
                }))
              }
              placeholder="Gere uma string grande para assinar sessões"
              className="mb-3 h-11 w-full rounded-card border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            />
          ) : null}
          <SettingLine icon={ShieldCheck} label="Cookie httpOnly para login" />
          <SettingLine icon={AlertTriangle} label="Segredos ficam no backend, não no browser" />
        </Panel>
      </div>

      <Panel title="Notificações por e-mail">
        <div className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
          <div className="space-y-3">
            <label className="block text-sm">
              <span className="mb-2 block text-subtext">E-mail que receberá notificações</span>
              <input
                type="email"
                value={notificationSettings.email}
                onChange={(event) =>
                  setNotificationSettings((current) => ({
                    ...current,
                    email: event.target.value
                  }))
                }
                placeholder="seuemail@dominio.com"
                className="h-11 w-full rounded-card border border-border bg-background px-3 outline-none focus:border-primary"
              />
            </label>
            <div className="grid gap-2 md:grid-cols-3">
              <ToggleSetting
                label="Ativar notificações"
                checked={notificationSettings.enabled}
                onChange={(checked) => setNotificationSettings((current) => ({ ...current, enabled: checked }))}
              />
              <ToggleSetting
                label="Post publicado"
                checked={notificationSettings.onPostSuccess}
                onChange={(checked) => setNotificationSettings((current) => ({ ...current, onPostSuccess: checked }))}
              />
              <ToggleSetting
                label="Conta desconectada"
                checked={notificationSettings.onAccountDisconnected}
                onChange={(checked) => setNotificationSettings((current) => ({ ...current, onAccountDisconnected: checked }))}
              />
            </div>
          </div>
          <div className="rounded-card border border-border bg-background p-4">
            <div className="text-sm font-semibold">Quando enviar</div>
            <div className="mt-2 text-sm text-subtext">
              O FastPost envia e-mail quando um post for publicado com sucesso e quando uma rede social desconectar do perfil selecionado.
            </div>
            <button onClick={testNotificationEmail} className="mt-4 rounded-card bg-primary px-4 py-2 text-sm font-semibold">
              Testar e-mail
            </button>
            {notificationMessage ? <div className="mt-3 text-sm text-subtext">{notificationMessage}</div> : null}
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel title="Modo contínuo pessoal">
          <p className="mb-4 text-sm text-subtext">
            Esses itens não bloqueiam o localhost. Eles entram quando formos deixar o FastPost rodando continuamente com banco, fila e storage reais.
          </p>
          <div className="grid gap-2 md:grid-cols-2">
            {(runtime?.production ?? []).map((item) => (
              <div key={item.name}>
                <SettingStatus
                  label={item.name}
                  value={item.configured ? "Configurado" : "Necessário para modo contínuo"}
                  ok={item.configured}
                  compact
                  missingLabel="Depois"
                />
                {!item.configured ? (
                  <input
                    type={item.name.includes("SECRET") || item.name.includes("KEY") ? "password" : "text"}
                    value={envFields[item.name] ?? ""}
                    onChange={(event) =>
                      setEnvFields((current) => ({
                        ...current,
                        [item.name]: event.target.value
                      }))
                    }
                    placeholder={`Preencher ${item.name}`}
                    className="mt-2 h-10 w-full rounded-card border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                ) : null}
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Rodar sempre ligado">
          <SettingLine icon={Clock} label="Usar build de produção: npm run build" />
          <SettingLine icon={Loader2} label="Process manager com auto-restart: PM2 ou Railway" />
          <SettingLine icon={Activity} label="Healthcheck ativo em /api/health" />
          <SettingLine icon={Library} label="PostgreSQL para persistir perfis, posts e logs" />
          <SettingLine icon={UploadCloud} label="Cloudflare R2 para arquivos de mídia" />
          <SettingCode command="pm2 start ecosystem.config.cjs" />
          <SettingCode command="pm2 save" />
        </Panel>
      </div>

      <Panel title="Salvar configurações">
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={saveLocalSettings} className="rounded-card bg-primary px-5 py-2.5 text-sm font-semibold">
            Salvar configurações
          </button>
          {settingsMessage ? <span className="text-sm text-subtext">{settingsMessage}</span> : null}
        </div>
      </Panel>

      <Panel title="Arquivo .env.local necessário">
        <pre className="overflow-x-auto rounded-card border border-border bg-background p-4 text-xs text-subtext">
{`FASTPOST_SESSION_SECRET="gere-uma-string-grande"
ZERNIO_API_KEY="sk_..."
ZERNIO_WEBHOOK_SECRET="..."
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
R2_ACCOUNT_ID="..."
R2_ACCESS_KEY_ID="..."
R2_SECRET_ACCESS_KEY="..."
R2_BUCKET="..."`}
        </pre>
      </Panel>
    </div>
  );
}

function DrawerInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
      <span className="text-subtext">{label}</span>
      <span className="min-w-0 truncate text-right font-semibold">{value}</span>
    </div>
  );
}

function ScheduleBlock({
  step,
  title,
  icon: Icon,
  active,
  children
}: {
  step?: string;
  title: string;
  icon?: React.ElementType;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-card border bg-panel p-5 ${active ? "border-primary/60" : "border-border"}`}>
      <div className="mb-4 flex items-center gap-3">
        <div className={`grid size-6 place-items-center rounded-full text-xs font-bold ${active ? "bg-primary/20 text-primary" : "bg-background text-subtext"}`}>
          {Icon ? <Icon size={14} /> : step}
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function SpeedMetricCard({
  icon: Icon,
  label,
  value,
  badge,
  tone
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  badge?: string;
  suffix?: string;
  tone: "primary" | "warning" | "success" | "danger";
}) {
  const toneClass = {
    primary: "bg-primary/20 text-primary",
    warning: "bg-warning/15 text-warning",
    success: "bg-success/15 text-success",
    danger: "bg-danger/15 text-danger"
  };

  return (
    <div className="rounded-card border border-border bg-panel p-5">
      <div className="mb-5 flex items-start justify-between">
        <div className={`grid size-10 place-items-center rounded-card ${toneClass[tone]}`}>
          <Icon size={18} />
        </div>
        {badge ? <span className="rounded-full bg-success/15 px-2 py-1 text-xs font-semibold text-success">{badge}</span> : null}
      </div>
      <div className="text-2xl font-semibold">{value}</div>
      <div className="mt-2 text-sm text-subtext">{label}</div>
    </div>
  );
}

function UsageBar({
  label,
  value,
  total,
  helper,
  tone
}: {
  label: string;
  value: number;
  total: number;
  helper: string;
  tone: "primary" | "danger" | "success";
}) {
  const percent = Math.min(100, Math.round((value / Math.max(total, 1)) * 100));

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold">{value} / {total}</span>
      </div>
      <div className="h-2 rounded-full bg-background">
        <div
          className={`h-full rounded-full ${tone === "danger" ? "bg-danger" : tone === "success" ? "bg-success" : "bg-primary"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-subtext">
        <span>{helper}</span>
        <span>{percent}%</span>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-card border border-border bg-panel p-5">
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Badge({ children, tone }: { children: React.ReactNode; tone: "success" | "warning" | "danger" | "neutral" }) {
  const styles = {
    success: "border-success/40 bg-success/10 text-success",
    warning: "border-warning/40 bg-warning/10 text-warning",
    danger: "border-danger/40 bg-danger/10 text-danger",
    neutral: "border-border bg-white/5 text-subtext"
  };

  return <span className={`inline-flex rounded-card border px-2.5 py-1 text-xs ${styles[tone]}`}>{children}</span>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 text-sm">
      <span className="text-subtext">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium">{value}</span>
    </div>
  );
}

function SettingLine({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="mb-3 flex items-center gap-3 rounded-card border border-border bg-background p-3 text-sm text-subtext">
      <Icon size={17} />
      <span>{label}</span>
    </div>
  );
}

function SettingStatus({
  label,
  value,
  ok,
  compact,
  missingLabel = "Faltando"
}: {
  label: string;
  value: string;
  ok: boolean;
  compact?: boolean;
  missingLabel?: string;
}) {
  return (
    <div className={`rounded-card border bg-background p-3 text-sm ${ok ? "border-success/30" : "border-warning/30"} ${compact ? "" : "mb-3"}`}>
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="font-medium">{label}</span>
        <Badge tone={ok ? "success" : "warning"}>{ok ? "Pronto" : missingLabel}</Badge>
      </div>
      <div className="text-xs text-subtext">{value}</div>
    </div>
  );
}

function SettingCode({ command }: { command: string }) {
  return (
    <div className="mt-2 rounded-card border border-border bg-background px-3 py-2 font-mono text-xs text-subtext">
      {command}
    </div>
  );
}

function ToggleSetting({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between rounded-card border p-3 text-left text-sm ${
        checked ? "border-primary bg-primary/15 text-white" : "border-border bg-background text-subtext"
      }`}
    >
      <span>{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-primary" : "bg-zinc-700"}`}>
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white transition ${checked ? "left-4" : "left-0.5"}`}
        />
      </span>
    </button>
  );
}
