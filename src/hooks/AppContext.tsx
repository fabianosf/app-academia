import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toast as sonnerToast } from "sonner";
import type { ClassReservation, UserProfile } from "@/types";

type ThemeMode = "light" | "dark";

interface AppState {
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [onboarded, setOnboarded] = useState(true);
  const [favorites, setFavorites] = useState<string[]>(["w1", "w7"]);
  const [reservations, setReservations] = useState<ClassReservation[]>([{ classId: "c2", reminder: true }]);
  const [brand, setBrand] = useState("Forma com Fabiano");
  const [ninaNote, setNinaNote] = useState("Avatar da Nina");
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

  const toast = (text: string) => {
    sonnerToast.success(text, {
      duration: 2600,
      closeButton: true,
    });
  };

  const value = useMemo<AppState>(() => ({
    profile,
    setProfile: (p) => { setProfile(p); toast("Perfil atualizado."); },
    onboarded,
    setOnboarded,
    favorites,
    toggleFavorite: (id) => {
      setFavorites((f) => f.includes(id) ? f.filter((x) => x !== id) : [...f, id]);
      toast(favorites.includes(id) ? "Removido dos favoritos." : "Treino favoritado.");
    },
    reservations,
    reserve: (classId) => {
      setReservations((r) => r.some((x) => x.classId === classId) ? r.filter((x) => x.classId !== classId) : [...r, { classId, reminder: false }]);
      toast("Aula reservada.");
    },
    toggleReminder: (classId) => {
      setReservations((r) => r.map((x) => x.classId === classId ? { ...x, reminder: !x.reminder } : x));
      toast("Lembrete atualizado.");
    },
    brand,
    setBrand,
    ninaNote,
    setNinaNote,
    theme,
    setTheme,
    toast,
  }), [profile, onboarded, favorites, reservations, brand, ninaNote, theme]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp");
  return ctx;
}
