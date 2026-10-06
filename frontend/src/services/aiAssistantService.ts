import type { AiChatMessage } from "@/types";
import { askNinaApi } from "@/services/api";

export interface AssistantRequest {
  message: string;
  context: { goal: string; level: string; lastWorkout: string; equipment: string[] };
}

export interface AssistantResponse {
  message: AiChatMessage;
  knowledgeHash?: string;
  model?: string;
}

export async function askNina(req: AssistantRequest): Promise<AssistantResponse> {
  const data = await askNinaApi(req.message, req.context);
  return {
    message: data.message,
    knowledgeHash: data.knowledgeHash,
    model: data.model,
  };
}
