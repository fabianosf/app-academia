import { analyzeMovementApi } from "@/services/api";

export interface MovementFrameInput {
  exercise: string;
  elapsedSeconds: number;
  sessionId?: number;
  consentAccepted?: boolean;
}

export interface MovementFrameResult {
  score: number;
  reps: number;
  cues: string[];
  disclaimer: string;
  sessionId?: number;
}

export async function analyzeFrame(input: MovementFrameInput): Promise<MovementFrameResult> {
  if (!input.consentAccepted) {
    throw new Error("Consentimento explícito é obrigatório para a análise demonstrativa.");
  }
  const data = await analyzeMovementApi({
    exercise: input.exercise,
    elapsedSeconds: input.elapsedSeconds,
    sessionId: input.sessionId,
    consentAccepted: true,
  });
  return {
    score: data.score,
    reps: data.reps,
    cues: data.cues,
    disclaimer: data.disclaimer,
    sessionId: data.sessionId,
  };
}
