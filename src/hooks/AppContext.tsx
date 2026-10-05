import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { ClassReservation, UserProfile } from "@/types";

interface Toast { id: string; text: string }

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
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = (text: string) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
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
    toast,
  }), [profile, onboarded, favorites, reservations, brand, ninaNote]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-50 flex flex-col gap-2 md:bottom-6" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto rounded-xl bg-stone-900 px-4 py-3 text-sm text-white shadow-lg">{t.text}</div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useApp() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp");
  return ctx;
}
