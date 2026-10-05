import type { AiChatMessage } from "@/types";

export interface AssistantRequest {
  message: string;
  context: { goal: string; level: string; lastWorkout: string; equipment: string[] };
}

export interface AssistantResponse {
  message: AiChatMessage;
}

const replies: { test: RegExp; text: string }[] = [
  { test: /agachamento/i, text: "No agachamento, pés na largura do quadril, peito aberto e descida controlada. Joelhos acompanham a direção dos pés. Se sentir desconforto no joelho, reduza a amplitude e use um apoio. Quer que eu monte uma série curta só com variações seguras?" },
  { test: /20 minutos|apenas 20/i, text: "Em 20 minutos, priorize corpo inteiro: agachamento, uma puxada ou remada, uma flexão adaptada e prancha. 3 séries, descanso curto. Melhor concluir com boa técnica do que acelerar." },
  { test: /casa/i, text: "Dá para adaptar o treino de academia para casa trocando máquinas por peso corporal, elástico ou halteres. Eu manteria o mesmo padrão de movimento e reduziria a carga, não o controle." },
  { test: /semana|treinei/i, text: "Nesta semana você já moveu pernas, core e uma sessão de academia. Falta um bloco de mobilidade para fechar 4 treinos. Posso sugerir 15 minutos de quadril e coluna." },
  { test: /condicionamento/i, text: "Para condicionamento, intervalos suaves funcionam bem: 30 segundos de movimento e 30 de caminhada, por 15 a 20 minutos. Mantenha fala possível. Se faltar ar demais, alongue a pausa." },
  { test: /monte um treino|treino para hoje/i, text: "Para hoje, eu montaria o funcional em casa: agachamento, flexão inclinada, ponte, prancha e mobilidade de quadril. Cerca de 25 minutos. Se ontem foi pernas, a ponte fica com amplitude menor." },
];

export async function askNina(req: AssistantRequest): Promise<AssistantResponse> {
  await new Promise((r) => setTimeout(r, 700));
  const hit = replies.find((item) => item.test.test(req.message));
  const text = hit?.text ?? `Entendi. Com objetivo de ${req.context.goal.toLowerCase()} e nível ${req.context.level.toLowerCase()}, o caminho mais seguro é consistência: sessões de ${req.context.equipment.length ? "com o que você já tem" : "peso corporal"}, técnica estável e um dia de mobilidade na semana. Posso detalhar séries se quiser.`;
  return {
    message: {
      id: crypto.randomUUID(),
      role: "assistant",
      content: text,
      createdAt: new Date().toISOString(),
    },
  };
}
