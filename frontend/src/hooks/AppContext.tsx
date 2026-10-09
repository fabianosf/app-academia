import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast as sonnerToast } from "sonner";
import type {
  Achievement,
  ClassReservation,
  Exercise,
  Instructor,
  LiveClass,
  Notification,
  User,
  UserGoal,
  UserProfile,
  Workout,
  WorkoutHistory,
} from "@/types";
import {
  fetchAchievements,
  fetchExercises,
  fetchFavorites,
  fetchGoals,
  fetchHistory,
  fetchInstructors,
  fetchLiveClasses,
  fetchLoadLogs,
  fetchNotifications,
  fetchProgress,
  fetchReservations,
  fetchSiteSettings,
  fetchWorkouts,
  fetchMe,
  login,
  logout,
  patchMe,
  patchProfile,
  toggleFavoriteApi,
  toggleReminderApi,
  toggleReservationApi,
  tryRestoreSession,
  type ApiUser,
  type LoadLogRow,
  type ProgressSummary,
} from "@/services/api";

type ThemeMode = "light" | "dark";

interface AppState {
  authChecking: boolean;
  authenticated: boolean;
  ready: boolean;
  bootError: string | null;
  signIn: (
    identifier: string,
    password: string,
    portal?: "student" | "management",
  ) => Promise<User>;
  signOut: () => void;
  user: User;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  updateUserName: (name: string) => Promise<void>;
  onboarded: boolean;
  setOnboarded: (v: boolean) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  reservations: ClassReservation[];
  reserve: (classId: string) => void;
  toggleReminder: (classId: string) => void;
  brand: string;
  setBrand: (v: string) => void;
  ninaNote: string;
  setNinaNote: (v: string) => void;
  theme: ThemeMode;
  setTheme: (v: ThemeMode) => void;
  toast: (text: string) => void;
  workouts: Workout[];
  exercises: Exercise[];
  liveClasses: LiveClass[];
  instructors: Instructor[];
  history: WorkoutHistory[];
  goals: UserGoal[];
  achievements: Achievement[];
  notifications: Notification[];
  loadLog: LoadLogRow[];
  weeklyFrequency: ProgressSummary["weeklyFrequency"];
  muscleProgress: ProgressSummary["muscleProgress"];
  exerciseById: (id: string) => Exercise | undefined;
  refreshTraining: () => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

const defaultProfile: UserProfile = {
  goal: "Condicionamento físico",
  level: "Intermediário",
  place: "Ambos",
  weeklyFrequency: 4,
  sessionMinutes: 30,
  equipment: ["Colchonete", "Halteres"],
  limitations: "",
  notifications: { reminders: true, live: true, nina: true },
  cameraConsent: false,
};

const defaultUser: User = {
  id: "0",
  name: "…",
  email: "",
  avatarInitials: "·",
  streakDays: 0,
  plan: "Essencial",
};

function mapUser(me: ApiUser): User {
  return {
    id: String(me.id),
    name: me.name,
    email: me.email,
    avatarInitials: me.avatarInitials,
    streakDays: me.streakDays,
    plan: me.plan,
    isStaff: Boolean(me.isStaff),
    role: me.role ?? "student",
    isPlatformAdmin: Boolean(me.isPlatformAdmin),
    isTeacher: Boolean(me.isTeacher),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [authChecking, setAuthChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [user, setUser] = useState<User>(defaultUser);
  const [profile, setProfileState] = useState<UserProfile>(defaultProfile);
  const [onboarded, setOnboarded] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [reservations, setReservations] = useState<ClassReservation[]>([]);
  const [brand, setBrand] = useState("Forma com Fabiano");
  const [ninaNote, setNinaNote] = useState("Avatar da Nina");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [history, setHistory] = useState<WorkoutHistory[]>([]);
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadLog, setLoadLog] = useState<LoadLogRow[]>([]);
  const [weeklyFrequency, setWeeklyFrequency] = useState<ProgressSummary["weeklyFrequency"]>([]);
  const [muscleProgress, setMuscleProgress] = useState<ProgressSummary["muscleProgress"]>([]);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const saved = window.localStorage.getItem("forma-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("forma-theme", theme);
  }, [theme]);

  const toast = useCallback((text: string) => {
    sonnerToast.success(text, { duration: 2600, closeButton: true });
  }, []);

  const refreshTraining = useCallback(async () => {
    const [hist, g, a, loads, progress, wos, exs, classes] = await Promise.all([
      fetchHistory(),
      fetchGoals(),
      fetchAchievements(),
      fetchLoadLogs(),
      fetchProgress(),
      fetchWorkouts(),
      fetchExercises(),
      fetchLiveClasses(),
    ]);
    setHistory(hist);
    setGoals(g);
    setAchievements(a);
    setLoadLog(loads);
    setWeeklyFrequency(progress.weeklyFrequency);
    setMuscleProgress(progress.muscleProgress);
    setUser((u) => ({ ...u, streakDays: progress.streakDays }));
    setWorkouts(wos);
    setExercises(exs);
    setLiveClasses(classes);
  }, []);

  const applyMe = useCallback((me: ApiUser) => {
    setUser(mapUser(me));
    if (me.profile) setProfileState(me.profile);
    setOnboarded(Boolean(me.onboarded));
    if (me.theme === "light" || me.theme === "dark") setTheme(me.theme);
  }, []);

  const loadAppData = useCallback(async () => {
    const [
      wos,
      exs,
      classes,
      instr,
      favs,
      resv,
      notifs,
      settings,
    ] = await Promise.all([
      fetchWorkouts(),
      fetchExercises(),
      fetchLiveClasses(),
      fetchInstructors(),
      fetchFavorites(),
      fetchReservations(),
      fetchNotifications(),
      fetchSiteSettings(),
    ]);
    setWorkouts(wos);
    setExercises(exs);
    setLiveClasses(classes);
    setInstructors(instr);
    setFavorites(favs);
    setReservations(resv);
    setNotifications(notifs);
    setBrand(settings.brandName);
    setNinaNote(settings.ninaAvatarNote);
    await refreshTraining();
  }, [refreshTraining]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAuthChecking(true);
      setBootError(null);
      try {
        const me = await tryRestoreSession();
        if (cancelled) return;
        if (!me) {
          setAuthenticated(false);
          setReady(false);
          return;
        }
        applyMe(me);
        setAuthenticated(true);
        await loadAppData();
        if (!cancelled) setReady(true);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setBootError(
            "Não foi possível conectar à API. Suba o backend em http://127.0.0.1:8000 e recarregue.",
          );
        }
      } finally {
        if (!cancelled) setAuthChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyMe, loadAppData]);

  const signIn = useCallback(
    async (
      identifier: string,
      password: string,
      portal?: "student" | "management",
    ) => {
      setBootError(null);
      await login(identifier, password, portal);
      const me = await fetchMe();
      applyMe(me);
      setAuthenticated(true);
      setReady(false);
      await loadAppData();
      setReady(true);
      return mapUser(me);
    },
    [applyMe, loadAppData],
  );

  const signOut = useCallback(() => {
    void logout();
    setAuthenticated(false);
    setReady(false);
    setUser(defaultUser);
    setProfileState(defaultProfile);
    setFavorites([]);
    setReservations([]);
    setWorkouts([]);
    setExercises([]);
    setLiveClasses([]);
    setInstructors([]);
    setHistory([]);
    setGoals([]);
    setAchievements([]);
    setNotifications([]);
    setLoadLog([]);
  }, []);

  const setProfile = useCallback(
    (p: UserProfile) => {
      setProfileState(p);
      void patchProfile(p)
        .then(() => toast("Perfil atualizado."))
        .catch(() => toast("Não foi possível salvar o perfil."));
    },
    [toast],
  );

  const updateUserName = useCallback(
    async (name: string) => {
      const me = await patchMe({ name });
      setUser(mapUser(me));
      toast("Perfil atualizado.");
    },
    [toast],
  );

  const value = useMemo<AppState>(
    () => ({
      authChecking,
      authenticated,
      ready,
      bootError,
      signIn,
      signOut,
      user,
      profile,
      setProfile,
      updateUserName,
      onboarded,
      setOnboarded: (v) => {
        setOnboarded(v);
        void patchMe({ onboarded: v });
      },
      favorites,
      toggleFavorite: (id) => {
        const removing = favorites.includes(id);
        setFavorites((f) => (removing ? f.filter((x) => x !== id) : [...f, id]));
        void toggleFavoriteApi(id)
          .then((res) => {
            setFavorites((f) => {
              const has = f.includes(id);
              if (res.favorited && !has) return [...f, id];
              if (!res.favorited && has) return f.filter((x) => x !== id);
              return f;
            });
            toast(res.favorited ? "Treino favoritado." : "Removido dos favoritos.");
          })
          .catch(() => {
            setFavorites((f) =>
              removing ? [...f, id] : f.filter((x) => x !== id),
            );
            toast("Falha ao atualizar favorito.");
          });
      },
      reservations,
      reserve: (classId) => {
        const had = reservations.some((x) => x.classId === classId);
        setReservations((r) =>
          had
            ? r.filter((x) => x.classId !== classId)
            : [...r, { classId, reminder: true }],
        );
        void toggleReservationApi(classId)
          .then((res) => {
            setReservations((r) => {
              const exists = r.some((x) => x.classId === classId);
              if (res.reserved && !exists) return [...r, { classId, reminder: true }];
              if (!res.reserved && exists) return r.filter((x) => x.classId !== classId);
              return r;
            });
            toast(res.reserved ? "Aula reservada." : "Reserva cancelada.");
          })
          .catch(() => {
            setReservations((r) =>
              had
                ? [...r, { classId, reminder: true }]
                : r.filter((x) => x.classId !== classId),
            );
            toast("Falha ao reservar aula.");
          });
      },
      toggleReminder: (classId) => {
        setReservations((r) =>
          r.map((x) =>
            x.classId === classId ? { ...x, reminder: !x.reminder } : x,
          ),
        );
        void toggleReminderApi(classId)
          .then((res) => {
            setReservations((r) =>
              r.map((x) =>
                x.classId === classId ? { ...x, reminder: res.reminder } : x,
              ),
            );
            toast("Lembrete atualizado.");
          })
          .catch(() => toast("Falha ao atualizar lembrete."));
      },
      brand,
      setBrand,
      ninaNote,
      setNinaNote,
      theme,
      setTheme: (v) => {
        setTheme(v);
        if (authenticated) void patchMe({ theme: v });
      },
      toast,
      workouts,
      exercises,
      liveClasses,
      instructors,
      history,
      goals,
      achievements,
      notifications,
      loadLog,
      weeklyFrequency,
      muscleProgress,
      exerciseById: (id) => exercises.find((e) => e.id === id),
      refreshTraining,
    }),
    [
      authChecking,
      authenticated,
      ready,
      bootError,
      signIn,
      signOut,
      user,
      profile,
      setProfile,
      updateUserName,
      onboarded,
      favorites,
      reservations,
      brand,
      ninaNote,
      theme,
      toast,
      workouts,
      exercises,
      liveClasses,
      instructors,
      history,
      goals,
      achievements,
      notifications,
      loadLog,
      weeklyFrequency,
      muscleProgress,
      refreshTraining,
    ],
  );

  if (bootError && !authenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f0ea] p-6 text-center">
        <div className="max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
          <p className="font-display text-2xl font-semibold text-[#1d2a26]">API indisponível</p>
          <p className="mt-2 text-sm text-stone-600">{bootError}</p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-stone-900 px-4 py-2 text-sm text-white"
            onClick={() => window.location.reload()}
          >
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp");
  return ctx;
}
