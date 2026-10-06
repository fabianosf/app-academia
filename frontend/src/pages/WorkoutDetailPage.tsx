import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { Heart } from "lucide-react";
import { Cover, ExerciseListItem } from "@/components/Cards";
import { Badge, Button } from "@/components/ui/primitives";
import { SafetyNotice } from "@/components/ShellBits";
import { useApp } from "@/hooks/AppContext";

export function WorkoutDetailPage() {
  const { id } = useParams();
  const { workouts, favorites, toggleFavorite, toast, exerciseById } = useApp();
  const workout = workouts.find((w) => w.id === id) ?? workouts[0];
  const [tip, setTip] = useState<string | null>(null);
  if (!workout) return <p className="text-sm text-stone-500">Treino não encontrado.</p>;
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <div>
        <Cover tone={workout.tone} label={workout.place} />
        <div className="mt-4 flex items-start justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold">{workout.name}</h1>
          <button aria-label="Favoritar treino" onClick={() => toggleFavorite(workout.id)} className="rounded-full border border-stone-200 p-2">
            <Heart className={favorites.includes(workout.id) ? "fill-[#e07a4a] text-[#e07a4a]" : ""} size={18} />
          </button>
        </div>
        <p className="mt-2 text-stone-600">{workout.description}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge>{workout.place}</Badge>
          <Badge>{workout.level}</Badge>
          <Badge>{workout.durationMin} min</Badge>
          <Badge tone="green">{workout.calories} kcal</Badge>
        </div>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Info title="Equipamentos" text={workout.equipment.join(", ")} />
          <Info title="Músculos trabalhados" text={workout.muscles.join(", ")} />
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-stone-600">
          {workout.safety.map((s) => <li key={s}>{s}</li>)}
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={`/treino/${workout.id}/executar`}><Button>Começar treino</Button></Link>
          <Button variant="secondary" onClick={() => toast("Treino adicionado à agenda de hoje.")}>Adicionar à agenda</Button>
        </div>
        <div className="mt-4"><SafetyNotice>Conteúdo educativo. Não substitui educador físico ou avaliação de saúde. Pare se sentir dor, tontura ou desconforto.</SafetyNotice></div>
      </div>
      <div>
        <h2 className="mb-3 font-display text-lg font-semibold">Exercícios</h2>
        <ol className="space-y-3">
          {workout.exerciseIds.map((eid) => {
            const ex = exerciseById(eid);
            return ex ? <ExerciseListItem key={eid} exercise={ex} onHelp={() => setTip(ex.tip)} /> : null;
          })}
        </ol>
        {tip && <p className="mt-3 rounded-xl bg-orange-50 p-3 text-sm">{tip}</p>}
      </div>
    </div>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return <div className="rounded-xl bg-white p-3"><p className="text-xs text-stone-500">{title}</p><p>{text}</p></div>;
}
