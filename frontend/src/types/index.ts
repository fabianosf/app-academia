export type Level = "Iniciante" | "Intermediário" | "Avançado";
export type Place = "Casa" | "Academia" | "Ambos";
export type Goal =
  | "Emagrecer"
  | "Ganhar massa muscular"
  | "Condicionamento físico"
  | "Mobilidade"
  | "Saúde e bem-estar";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  streakDays: number;
  plan: "Essencial" | "Completo";
  isStaff?: boolean;
}

export interface UserProfile {
  goal: Goal;
  level: Level;
  place: Place;
  weeklyFrequency: number;
  sessionMinutes: number;
  equipment: string[];
  limitations: string;
  notifications: { reminders: boolean; live: boolean; nina: boolean };
  cameraConsent: boolean;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  suggestedLoad?: string;
  tip: string;
  focus: string;
  place: Place;
}

export interface Workout {
  id: string;
  name: string;
  description: string;
  place: "Casa" | "Academia";
  level: Level;
  durationMin: number;
  calories: number;
  focus: string[];
  equipment: string[];
  muscles: string[];
  safety: string[];
  exerciseIds: string[];
  tone: string;
}

export interface WorkoutSession {
  workoutId: string;
  startedAt: string;
  finishedAt?: string;
  completedExercises: number;
  difficulty?: "Muito fácil" | "Fácil" | "Ideal" | "Difícil" | "Muito difícil";
  note?: string;
}

export interface WorkoutHistory {
  id: string;
  workoutId: string;
  date: string;
  minutes: number;
  calories: number;
  place: "Casa" | "Academia";
}

export interface Instructor {
  id: string;
  name: string;
  specialty: string;
}

export interface LiveClass {
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  durationMin: number;
  instructorId: string;
  level: Level;
  spots: number;
  participants: number;
  status: "live" | "upcoming" | "recorded";
  tone: string;
}

export interface ClassReservation {
  classId: string;
  reminder: boolean;
}

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface AiRecommendation {
  id: string;
  text: string;
  cta: string;
}

export interface MovementAnalysis {
  exercise: string;
  score: number;
  reps: number;
  cues: string[];
  status: "idle" | "preview" | "analyzing";
}

export interface UserGoal {
  id: string;
  label: string;
  current: number;
  target: number;
  unit: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}
