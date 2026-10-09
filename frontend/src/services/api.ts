import type {
  Achievement,
  AiChatMessage,
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
import { apiFetch, clearTokens, unwrapList, type Paginated } from "./http";

export type ApiUser = User & {
  onboarded?: boolean;
  theme?: string;
  profile?: UserProfile;
  subscriptionStatus?: string;
};

export type ProgressSummary = {
  streakDays: number;
  weeklyFrequency: { day: string; treinos: number; minutos: number }[];
  muscleProgress: { group: string; value: number }[];
  totalSessions: number;
};

export type LoadLogRow = { id?: number; exercise: string; last: string; note: string };

export async function login(username: string, password: string) {
  clearTokens();
  return apiFetch<{ detail: string }>(
    "/auth/token/",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    },
    false,
  );
}

export async function logout() {
  try {
    await apiFetch<{ detail: string }>(
      "/auth/logout/",
      { method: "POST", body: JSON.stringify({}) },
      false,
    );
  } finally {
    clearTokens();
  }
}

export async function requestPasswordReset(email: string) {
  return apiFetch<{ detail: string; devResetUrl?: string }>(
    "/auth/password-reset/",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
    false,
  );
}

export async function confirmPasswordReset(payload: {
  uid: string;
  token: string;
  password: string;
}) {
  return apiFetch<{ detail: string }>(
    "/auth/password-reset/confirm/",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    false,
  );
}

/** Tenta sessão via cookie HttpOnly; não faz login automático com demo. */
export async function tryRestoreSession() {
  try {
    return await fetchMe();
  } catch {
    clearTokens();
    return null;
  }
}

export function createExerciseApi(payload: {
  name: string;
  sets?: number;
  reps?: string;
  restSeconds?: number;
  tip?: string;
  focus?: string;
  place?: string;
}) {
  return apiFetch<Exercise>("/exercises/", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      sets: payload.sets ?? 3,
      reps: payload.reps ?? "10",
      restSeconds: payload.restSeconds ?? 45,
      tip: payload.tip ?? "",
      focus: payload.focus ?? "Geral",
      place: payload.place ?? "Casa",
    }),
  });
}

export function createWorkoutApi(payload: {
  name: string;
  description?: string;
  place?: string;
  level?: string;
  durationMin?: number;
  calories?: number;
  focus?: string;
}) {
  return apiFetch<Workout>("/workouts/", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      description: payload.description ?? "",
      place: payload.place ?? "Casa",
      level: payload.level ?? "Iniciante",
      duration_min: payload.durationMin ?? 30,
      calories: payload.calories ?? 200,
      focus: payload.focus ?? "Geral",
      equipment: [],
      muscles: [],
      safety: "",
      tone: "",
      exercise_ids: [],
    }),
  });
}

export function createLiveClassApi(payload: {
  title: string;
  category?: string;
  streamUrl?: string;
}) {
  return apiFetch<LiveClass>("/live/classes/", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      category: payload.category ?? "Geral",
      streamUrl: payload.streamUrl ?? "",
    }),
  });
}

export function fetchMe() {
  return apiFetch<ApiUser>("/me/");
}

export function patchMe(payload: Record<string, unknown>) {
  return apiFetch<ApiUser>("/me/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function patchProfile(profile: Partial<UserProfile>) {
  return apiFetch<UserProfile>("/me/profile/", {
    method: "PATCH",
    body: JSON.stringify({
      goal: profile.goal,
      level: profile.level,
      place: profile.place,
      weekly_frequency: profile.weeklyFrequency,
      session_minutes: profile.sessionMinutes,
      equipment: profile.equipment,
      limitations: profile.limitations,
      camera_consent: profile.cameraConsent,
      notifications: profile.notifications,
    }),
  });
}

export async function fetchWorkouts() {
  return unwrapList(await apiFetch<Paginated<Workout> | Workout[]>("/workouts/"));
}

export async function fetchExercises() {
  return unwrapList(await apiFetch<Paginated<Exercise> | Exercise[]>("/exercises/"));
}

export async function fetchLiveClasses() {
  return apiFetch<LiveClass[]>("/live/classes/");
}

export async function fetchInstructors() {
  return apiFetch<Instructor[]>("/live/instructors/");
}

export async function fetchFavorites() {
  const data = await apiFetch<{ favorites: string[] }>("/training/favorites/");
  return data.favorites;
}

export function toggleFavoriteApi(workoutId: string) {
  return apiFetch<{ favorited: boolean; workoutId: string }>("/training/favorites/", {
    method: "POST",
    body: JSON.stringify({ workoutId }),
  });
}

export async function fetchReservations() {
  const rows = await apiFetch<ClassReservation[]>("/live/reservations/");
  return rows.map((r) => ({ classId: r.classId, reminder: r.reminder }));
}

export function toggleReservationApi(classId: string, reminder = true) {
  return apiFetch<{ reserved: boolean; classId: string }>("/live/reservations/", {
    method: "POST",
    body: JSON.stringify({ classId, reminder }),
  });
}

export function toggleReminderApi(classId: string) {
  return apiFetch<ClassReservation>(`/live/reservations/${classId}/reminder/`, {
    method: "PATCH",
    body: JSON.stringify({}),
  });
}

export async function fetchHistory() {
  return unwrapList(
    await apiFetch<Paginated<WorkoutHistory> | WorkoutHistory[]>("/training/history/"),
  );
}

export async function fetchGoals() {
  return unwrapList(await apiFetch<Paginated<UserGoal> | UserGoal[]>("/training/goals/"));
}

export async function fetchAchievements() {
  return unwrapList(
    await apiFetch<Paginated<Achievement> | Achievement[]>("/training/achievements/"),
  );
}

export async function fetchLoadLogs() {
  return unwrapList(
    await apiFetch<Paginated<LoadLogRow> | LoadLogRow[]>("/training/load-logs/"),
  );
}

export function fetchProgress() {
  return apiFetch<ProgressSummary>("/training/progress/");
}

export function fetchNotifications() {
  return apiFetch<Notification[]>("/notifications/");
}

export function fetchSiteSettings() {
  return apiFetch<{ brandName: string; ninaAvatarNote: string }>("/branding/settings/");
}

export function patchSiteSettings(payload: { brandName?: string; ninaAvatarNote?: string }) {
  return apiFetch<{ brandName: string; ninaAvatarNote: string }>("/branding/settings/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function createSession(payload: {
  workoutId: string;
  startedAt: string;
  finishedAt?: string;
  completedExercises: number;
  difficulty?: string;
  note?: string;
  minutes: number;
  calories: number;
  place?: string;
}) {
  return apiFetch("/training/sessions/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type NinaChatResponse = {
  message: AiChatMessage;
  userMessage?: AiChatMessage;
  knowledgeHash?: string;
  model?: string;
};

export async function askNinaApi(message: string, context: Record<string, unknown>) {
  return apiFetch<NinaChatResponse>("/assistant/nina/chat/", {
    method: "POST",
    body: JSON.stringify({ message, context }),
  });
}

export function analyzeMovementApi(payload: {
  exercise: string;
  elapsedSeconds: number;
  consentAccepted?: boolean;
  sessionId?: number;
  score?: number;
  reps?: number;
  cues?: string[];
  source?: string;
}) {
  return apiFetch<{
    sessionId: number;
    score: number;
    reps: number;
    cues: string[];
    disclaimer: string;
    source?: string;
  }>("/movement/analyze/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type ExerciseDemoDto = {
  id: string;
  exercise_name: string;
  variation: string;
  equipment: string[];
  level: string;
  duration_sec: number;
  media_url: string;
  status: string;
  ai_generated: boolean;
  structured_script: string[];
  source_notes: { title?: string; url?: string }[];
};

export type DemoJobDto = {
  id: string;
  status: string;
  provider: string;
  persona: string;
  safe_error: string;
  demo: ExerciseDemoDto | null;
};

export type ExerciseAssistDto = {
  id: string;
  text: string;
  status: string;
  interpretation: Record<string, unknown>;
  clarifying_question: string;
  answer_text: string;
  steps: string[];
  cautions: string[];
  personalized_from_profile: boolean;
  health_caution: boolean;
  search_status: string;
  sources: {
    title: string;
    url: string;
    authorship: string;
    summary: string;
    consulted_at: string;
  }[];
  matchedDemo: ExerciseDemoDto | null;
  catalogExerciseId: string | null;
  jobs: DemoJobDto[];
};

export function createExerciseAssist(payload: {
  message: string;
  persona?: string;
  requestVideo?: boolean;
}) {
  return apiFetch<ExerciseAssistDto>("/assistant/exercise-assist/", {
    method: "POST",
    body: JSON.stringify({
      message: payload.message,
      persona: payload.persona ?? "neutral",
      requestVideo: payload.requestVideo ?? true,
    }),
  });
}

export function clarifyExerciseAssist(
  id: string,
  payload: { answer: string; persona?: string; requestVideo?: boolean },
) {
  return apiFetch<ExerciseAssistDto>(`/assistant/exercise-assist/${id}/clarify/`, {
    method: "POST",
    body: JSON.stringify({
      answer: payload.answer,
      persona: payload.persona ?? "neutral",
      requestVideo: payload.requestVideo ?? true,
    }),
  });
}

export function fetchExerciseAssist(id: string) {
  return apiFetch<ExerciseAssistDto>(`/assistant/exercise-assist/${id}/`);
}

export function sendAssistFeedback(payload: {
  assistRequestId: string;
  demoId?: string;
  useful?: boolean;
  equipmentOk?: boolean;
  preferShorter?: boolean;
  comment?: string;
}) {
  return apiFetch("/assistant/feedback/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchDemos(status: string = "approved") {
  const q = encodeURIComponent(status);
  return apiFetch<ExerciseDemoDto[]>(`/assistant/demos/?status=${q}`);
}

export function reviewDemoApi(demoId: string, action: "approve" | "reject") {
  return apiFetch<ExerciseDemoDto>(`/assistant/demos/${demoId}/review/`, {
    method: "POST",
    body: JSON.stringify({ action }),
  });
}

export function fetchDemoJob(jobId: string) {
  return apiFetch<DemoJobDto>(`/assistant/demos/jobs/${jobId}/`);
}
