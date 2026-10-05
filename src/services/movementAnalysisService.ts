export interface MovementFrameInput {
  exercise: string;
  elapsedSeconds: number;
}

export interface MovementFrameResult {
  score: number;
  reps: number;
  cues: string[];
  disclaimer: string;
}

export async function analyzeFrame(input: MovementFrameInput): Promise<MovementFrameResult> {
  await new Promise((r) => setTimeout(r, 400));
  const reps = Math.min(12, Math.floor(input.elapsedSeconds / 4));
  return {
    score: 78,
    reps,
    cues: [
      "Enquadramento adequado.",
      "Ritmo controlado.",
      input.exercise.includes("Agach") ? "Atenção ao alinhamento dos joelhos." : "Mantenha a coluna neutra.",
      "Mantenha a coluna neutra.",
    ],
    disclaimer: "Demonstração — integração de visão computacional pendente.",
  };
}
