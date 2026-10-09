import { analyzeMovementApi } from "@/services/api";

export interface MovementFrameInput {
  exercise: string;
  elapsedSeconds: number;
  sessionId?: number;
  consentAccepted?: boolean;
  score?: number;
  reps?: number;
  cues?: string[];
  source?: "client_pose" | "mediapipe" | "none";
}

export interface MovementFrameResult {
  score: number;
  reps: number;
  cues: string[];
  disclaimer: string;
  sessionId?: number;
  source?: string;
}

export async function analyzeFrame(input: MovementFrameInput): Promise<MovementFrameResult> {
  if (!input.consentAccepted) {
    throw new Error("Consentimento explícito é obrigatório para a análise.");
  }
  const data = await analyzeMovementApi({
    exercise: input.exercise,
    elapsedSeconds: input.elapsedSeconds,
    sessionId: input.sessionId,
    consentAccepted: true,
    score: input.score,
    reps: input.reps,
    cues: input.cues,
    source: input.source ?? "none",
  });
  return {
    score: data.score,
    reps: data.reps,
    cues: data.cues,
    disclaimer: data.disclaimer,
    sessionId: data.sessionId,
    source: data.source,
  };
}
