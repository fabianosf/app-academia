import type { Exercise, Workout, LiveClass, Instructor, WorkoutHistory, Achievement, UserGoal, Notification, User } from "@/types";

export const user: User = {
  id: "u1",
  name: "Fabiano",
  email: "fabiano@postay.com.br",
  avatarInitials: "FF",
  streakDays: 4,
  plan: "Completo",
};

export const exercises: Exercise[] = [
  { id: "e1", name: "Agachamento com peso corporal", sets: 3, reps: "12", restSeconds: 45, tip: "Desça até as coxas ficarem quase paralelas ao chão e empurre o chão com o pé inteiro.", focus: "Pernas", place: "Ambos" },
  { id: "e2", name: "Prancha frontal", sets: 3, reps: "30 s", restSeconds: 30, tip: "Mantenha costelas baixas e pescoço longo. Não prenda a respiração.", focus: "Core", place: "Ambos" },
  { id: "e3", name: "Flexão inclinada", sets: 3, reps: "10", restSeconds: 40, tip: "Corpo em linha. Se precisar, use um apoio mais alto.", focus: "Peito", place: "Casa" },
  { id: "e4", name: "Ponte de glúteo", sets: 3, reps: "15", restSeconds: 40, tip: "Pause no topo sem arquear a lombar.", focus: "Glúteos", place: "Casa" },
  { id: "e5", name: "Mobilidade de quadril", sets: 2, reps: "40 s", restSeconds: 20, tip: "Movimento lento. Pare se houver pinçamento.", focus: "Mobilidade", place: "Ambos" },
  { id: "e6", name: "Polichinelo suave", sets: 3, reps: "30 s", restSeconds: 30, tip: "Aterrize com joelhos macios. Reduza a amplitude se o impacto incomodar.", focus: "Cardio", place: "Casa" },
  { id: "e7", name: "Afundo alternado", sets: 3, reps: "10 cada", restSeconds: 45, tip: "Passo confortável. Joelho da frente acompanha a direção do pé.", focus: "Pernas", place: "Ambos" },
  { id: "e8", name: "Remada com halter", sets: 3, reps: "12", restSeconds: 50, suggestedLoad: "8–12 kg", tip: "Puxe o cotovelo para trás, sem girar o tronco.", focus: "Costas", place: "Ambos" },
  { id: "e9", name: "Desenvolvimento sentado", sets: 3, reps: "10", restSeconds: 60, suggestedLoad: "6–10 kg", tip: "Suba sem travar o cotovelo no topo.", focus: "Ombros", place: "Academia" },
  { id: "e10", name: "Leg press", sets: 4, reps: "10", restSeconds: 75, suggestedLoad: "carga moderada", tip: "Não trave os joelhos. Controle a descida.", focus: "Pernas", place: "Academia" },
  { id: "e11", name: "Supino com halteres", sets: 4, reps: "8–10", restSeconds: 75, suggestedLoad: "12–16 kg", tip: "Escápulas apoiadas no banco. Desça até o conforto do ombro.", focus: "Peito", place: "Academia" },
  { id: "e12", name: "Tríceps pulley", sets: 3, reps: "12", restSeconds: 45, suggestedLoad: "leve a moderada", tip: "Cotovelos próximos do corpo.", focus: "Braços", place: "Academia" },
  { id: "e13", name: "Puxada frontal", sets: 4, reps: "10", restSeconds: 70, suggestedLoad: "moderada", tip: "Puxe até a altura do peito, sem jogar o tronco para trás.", focus: "Costas", place: "Academia" },
  { id: "e14", name: "Rosca direta", sets: 3, reps: "12", restSeconds: 45, suggestedLoad: "6–10 kg", tip: "Evite balançar o tronco para subir a carga.", focus: "Braços", place: "Academia" },
  { id: "e15", name: "Stiff com halteres", sets: 3, reps: "10", restSeconds: 60, suggestedLoad: "8–14 kg", tip: "Joelhos levemente flexionados. Sinta o posterior, não a lombar.", focus: "Posterior", place: "Ambos" },
  { id: "e16", name: "Abdução de quadril", sets: 3, reps: "15", restSeconds: 40, tip: "Movimento controlado. Não arqueie a lombar.", focus: "Glúteos", place: "Academia" },
  { id: "e17", name: "Dead bug", sets: 3, reps: "8 cada", restSeconds: 30, tip: "Lombar apoiada no colchonete durante todo o movimento.", focus: "Core", place: "Casa" },
  { id: "e18", name: "Alongamento de peitoral", sets: 2, reps: "40 s", restSeconds: 15, tip: "Respire devagar. Sem dor aguda.", focus: "Mobilidade", place: "Ambos" },
  { id: "e19", name: "Gato-camelo", sets: 2, reps: "8", restSeconds: 20, tip: "Mobilize a coluna sem forçar o pescoço.", focus: "Mobilidade", place: "Casa" },
  { id: "e20", name: "Caminhada no lugar", sets: 1, reps: "3 min", restSeconds: 0, tip: "Ritmo conversável. Braços soltos.", focus: "Cardio", place: "Casa" },
  { id: "e21", name: "Elevação lateral", sets: 3, reps: "12", restSeconds: 40, suggestedLoad: "3–6 kg", tip: "Cotovelos levemente flexionados. Suba até a linha do ombro.", focus: "Ombros", place: "Ambos" },
  { id: "e22", name: "Agachamento goblet", sets: 3, reps: "12", restSeconds: 50, suggestedLoad: "8–14 kg", tip: "Halter próximo do peito. Joelhos acompanham os pés.", focus: "Pernas", place: "Ambos" },
];

export const workouts: Workout[] = [
  { id: "w1", name: "Funcional em casa", description: "Circuito equilibrado para força geral, core e mobilidade, sem depender de máquinas.", place: "Casa", level: "Intermediário", durationMin: 25, calories: 210, focus: ["Corpo inteiro", "Core"], equipment: ["Colchonete"], muscles: ["Pernas", "Core", "Glúteos", "Peito"], safety: ["Mantenha o ritmo controlado.", "Interrompa se sentir dor articular."], exerciseIds: ["e1", "e3", "e4", "e2", "e5"], tone: "from-orange-200 to-amber-100" },
  { id: "w2", name: "HIIT sem equipamentos", description: "Intervalos curtos para elevar o condicionamento com impacto moderado.", place: "Casa", level: "Intermediário", durationMin: 20, calories: 240, focus: ["Cardio", "Corpo inteiro"], equipment: ["Nenhum"], muscles: ["Pernas", "Core"], safety: ["Adapte a amplitude.", "Hidrate-se entre os blocos."], exerciseIds: ["e6", "e1", "e3", "e7"], tone: "from-rose-200 to-orange-100" },
  { id: "w3", name: "Pernas na academia", description: "Sessão de membros inferiores com máquinas e halteres, foco em controle.", place: "Academia", level: "Intermediário", durationMin: 45, calories: 380, focus: ["Pernas"], equipment: ["Máquinas de academia", "Halteres"], muscles: ["Quadríceps", "Glúteos", "Posterior"], safety: ["Não trave as articulações.", "Peça auxílio para ajustar a máquina."], exerciseIds: ["e10", "e7", "e15", "e22"], tone: "from-stone-200 to-orange-100" },
  { id: "w4", name: "Peito e tríceps", description: "Empurrar com amplitude confortável e finalização de tríceps.", place: "Academia", level: "Intermediário", durationMin: 50, calories: 340, focus: ["Peito", "Braços"], equipment: ["Banco", "Halteres", "Máquinas de academia"], muscles: ["Peito", "Tríceps", "Ombros"], safety: ["Evite amplitude que gere pinçamento no ombro."], exerciseIds: ["e11", "e3", "e12", "e21"], tone: "from-amber-200 to-orange-50" },
  { id: "w5", name: "Costas e bíceps", description: "Puxadas e remadas para postura e força de membros superiores.", place: "Academia", level: "Intermediário", durationMin: 50, calories: 330, focus: ["Costas", "Braços"], equipment: ["Máquinas de academia", "Halteres"], muscles: ["Costas", "Bíceps"], safety: ["Inicie com carga que permita técnica estável."], exerciseIds: ["e13", "e8", "e14"], tone: "from-teal-100 to-stone-100" },
  { id: "w6", name: "Glúteos e posterior", description: "Trabalho de cadeia posterior com atenção à lombar.", place: "Academia", level: "Intermediário", durationMin: 45, calories: 320, focus: ["Glúteos", "Pernas"], equipment: ["Halteres", "Máquinas de academia", "Colchonete"], muscles: ["Glúteos", "Posterior"], safety: ["Se a lombar cansar antes do glúteo, reduza a carga."], exerciseIds: ["e4", "e15", "e16", "e7"], tone: "from-orange-100 to-rose-100" },
  { id: "w7", name: "Core e mobilidade", description: "Estabilidade de tronco e amplitude suave para o dia a dia.", place: "Casa", level: "Iniciante", durationMin: 20, calories: 120, focus: ["Core", "Mobilidade"], equipment: ["Colchonete"], muscles: ["Core", "Quadril"], safety: ["Movimentos lentos. Sem prender a respiração."], exerciseIds: ["e2", "e17", "e5", "e19"], tone: "from-lime-100 to-emerald-50" },
  { id: "w8", name: "Alongamento pós-treino", description: "Desaceleração de 15 minutos para soltar ombros, quadril e coluna.", place: "Casa", level: "Iniciante", durationMin: 15, calories: 60, focus: ["Mobilidade"], equipment: ["Colchonete"], muscles: ["Corpo inteiro"], safety: ["Alongue até sentir tensão confortável, nunca dor."], exerciseIds: ["e18", "e5", "e19"], tone: "from-sky-100 to-stone-100" },
  { id: "w9", name: "Treino rápido de braços", description: "Sessão curta de ombros e braços, útil entre compromissos.", place: "Academia", level: "Iniciante", durationMin: 20, calories: 150, focus: ["Braços"], equipment: ["Halteres"], muscles: ["Bíceps", "Tríceps", "Ombros"], safety: ["Priorize controle sobre carga."], exerciseIds: ["e14", "e12", "e21"], tone: "from-orange-100 to-amber-50" },
  { id: "w10", name: "Corpo inteiro com halteres", description: "Força geral usando apenas halteres e um espaço pequeno.", place: "Casa", level: "Intermediário", durationMin: 35, calories: 280, focus: ["Corpo inteiro"], equipment: ["Halteres", "Colchonete"], muscles: ["Pernas", "Costas", "Peito", "Core"], safety: ["Apoie os halteres com segurança ao trocar de exercício."], exerciseIds: ["e22", "e8", "e11", "e15", "e2"], tone: "from-stone-200 to-orange-100" },
  { id: "w11", name: "Cardio leve para iniciantes", description: "Entrada suave no movimento, com intensidade conversável.", place: "Casa", level: "Iniciante", durationMin: 25, calories: 160, focus: ["Cardio"], equipment: ["Nenhum"], muscles: ["Pernas", "Cardio"], safety: ["Pare se sentir tontura ou falta de ar desproporcional."], exerciseIds: ["e20", "e6", "e5"], tone: "from-emerald-100 to-lime-50" },
  { id: "w12", name: "Mobilidade para quem fica sentado", description: "Quadril, coluna e ombros para quem passa o dia na cadeira.", place: "Casa", level: "Iniciante", durationMin: 15, calories: 50, focus: ["Mobilidade"], equipment: ["Nenhum"], muscles: ["Quadril", "Coluna", "Ombros"], safety: ["Faça em ritmo respiratório. Não force o final da amplitude."], exerciseIds: ["e19", "e5", "e18"], tone: "from-amber-100 to-stone-100" },
];

export const instructors: Instructor[] = [
  { id: "i1", name: "Marina Costa", specialty: "Funcional e mobilidade" },
  { id: "i2", name: "Rafael Lima", specialty: "Força na academia" },
  { id: "i3", name: "Lívia Nunes", specialty: "Condicionamento" },
];

export const liveClasses: LiveClass[] = [
  { id: "c1", title: "Mobilidade de manhã", category: "Mobilidade", date: "Hoje", time: "07:30", durationMin: 30, instructorId: "i1", level: "Iniciante", spots: 40, participants: 28, status: "live", tone: "from-orange-200 to-amber-100" },
  { id: "c2", title: "Força em casa sem pressa", category: "Casa", date: "Hoje", time: "19:00", durationMin: 40, instructorId: "i1", level: "Intermediário", spots: 50, participants: 31, status: "upcoming", tone: "from-rose-100 to-orange-50" },
  { id: "c3", title: "Pernas com técnica", category: "Academia", date: "Amanhã", time: "18:30", durationMin: 45, instructorId: "i2", level: "Intermediário", spots: 35, participants: 22, status: "upcoming", tone: "from-stone-200 to-orange-100" },
  { id: "c4", title: "Cardio conversável", category: "Cardio", date: "Quarta", time: "12:15", durationMin: 25, instructorId: "i3", level: "Iniciante", spots: 60, participants: 18, status: "upcoming", tone: "from-lime-100 to-emerald-50" },
  { id: "c5", title: "Core estável", category: "Core", date: "Ontem", time: "20:00", durationMin: 20, instructorId: "i1", level: "Iniciante", spots: 40, participants: 36, status: "recorded", tone: "from-teal-100 to-stone-100" },
  { id: "c6", title: "Glúteos com controle", category: "Glúteos", date: "Sábado", time: "09:00", durationMin: 40, instructorId: "i2", level: "Intermediário", spots: 40, participants: 40, status: "recorded", tone: "from-orange-100 to-rose-50" },
];

export const history: WorkoutHistory[] = [
  { id: "h1", workoutId: "w1", date: "2026-10-05", minutes: 26, calories: 210, place: "Casa" },
  { id: "h2", workoutId: "w7", date: "2026-10-04", minutes: 20, calories: 120, place: "Casa" },
  { id: "h3", workoutId: "w3", date: "2026-10-02", minutes: 47, calories: 390, place: "Academia" },
  { id: "h4", workoutId: "w12", date: "2026-10-01", minutes: 15, calories: 50, place: "Casa" },
  { id: "h5", workoutId: "w10", date: "2026-09-29", minutes: 36, calories: 280, place: "Casa" },
  { id: "h6", workoutId: "w11", date: "2026-09-27", minutes: 25, calories: 160, place: "Casa" },
];

export const goals: UserGoal[] = [
  { id: "g1", label: "Treinar 4x na semana", current: 3, target: 4, unit: "treinos" },
  { id: "g2", label: "Completar 12 treinos no mês", current: 6, target: 12, unit: "treinos" },
  { id: "g3", label: "Mobilidade 3x por semana", current: 1, target: 3, unit: "sessões" },
];

export const achievements: Achievement[] = [
  { id: "a1", title: "Primeiro treino", description: "Você começou. Isso já conta.", unlocked: true },
  { id: "a2", title: "7 dias em movimento", description: "Uma semana com presença constante.", unlocked: false },
  { id: "a3", title: "10 treinos concluídos", description: "Consistência acima de intensidade.", unlocked: false },
  { id: "a4", title: "Consistência mensal", description: "12 treinos no mesmo mês.", unlocked: false },
];

export const notifications: Notification[] = [
  { id: "n1", title: "Treino de hoje", body: "Funcional em casa está pronto para começar.", time: "há 1 h", read: false },
  { id: "n2", title: "Aula às 19h", body: "Força em casa sem pressa ainda tem vagas.", time: "há 3 h", read: false },
  { id: "n3", title: "Nina", body: "Ontem foi pernas. Hoje, mobilidade pode equilibrar a semana.", time: "ontem", read: true },
];

export const weeklyFrequency = [
  { day: "Seg", treinos: 1, minutos: 26 },
  { day: "Ter", treinos: 1, minutos: 20 },
  { day: "Qua", treinos: 0, minutos: 0 },
  { day: "Qui", treinos: 1, minutos: 47 },
  { day: "Sex", treinos: 0, minutos: 0 },
  { day: "Sáb", treinos: 1, minutos: 15 },
  { day: "Dom", treinos: 0, minutos: 0 },
];

export const muscleProgress = [
  { group: "Pernas", value: 72 },
  { group: "Core", value: 64 },
  { group: "Costas", value: 48 },
  { group: "Peito", value: 41 },
  { group: "Mobilidade", value: 58 },
];

export const loadLog = [
  { exercise: "Leg press", last: "80 kg", note: "10 reps confortáveis" },
  { exercise: "Supino com halteres", last: "14 kg", note: "controle na descida" },
  { exercise: "Remada com halter", last: "12 kg", note: "sem balanço" },
];
