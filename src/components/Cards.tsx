import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import type { Workout, Exercise, LiveClass } from "@/types";
import { Badge, Button } from "@/components/ui/primitives";
import { exercises, instructors } from "@/data/mock";
import { useApp } from "@/hooks/AppContext";

export function Cover({ tone, label }: { tone: string; label: string }) {
  return (
    <div className={`relative grid h-36 place-items-end overflow-hidden rounded-2xl bg-gradient-to-br ${tone} p-4`}>
      <div className="absolute -right-4 -top-6 h-24 w-24 rounded-full bg-white/40" />
      <div className="absolute bottom-6 left-6 h-16 w-16 rounded-full bg-[#e07a4a]/20" />
      <span className="relative text-xs font-semibold uppercase tracking-wide text-stone-700">{label}</span>
    </div>
  );
}

export function WorkoutCard({ workout }: { workout: Workout }) {
  const { favorites, toggleFavorite } = useApp();
  const fav = favorites.includes(workout.id);
  return (
    <article className="flex flex-col rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
      <Cover tone={workout.tone} label={workout.focus[0]} />
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-semibold">{workout.name}</h3>
        <button aria-label={fav ? "Remover favorito" : "Favoritar treino"} onClick={() => toggleFavorite(workout.id)} className="rounded-full p-2 hover:bg-stone-50">
          <Heart size={18} className={fav ? "fill-[#e07a4a] text-[#e07a4a]" : "text-stone-400"} />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge>{workout.place}</Badge>
        <Badge>{workout.level}</Badge>
        <Badge tone="green">{workout.durationMin} min</Badge>
      </div>
      <p className="mt-2 text-sm text-stone-500">{workout.exerciseIds.length} exercícios · {workout.focus.join(", ")}</p>
      <Link to={`/treinos/${workout.id}`} className="mt-3"><Button className="w-full">Ver treino</Button></Link>
    </article>
  );
}

export function ExerciseListItem({ exercise, onHelp }: { exercise: Exercise; onHelp?: () => void }) {
  return (
    <li className="flex gap-3 rounded-2xl border border-stone-200 bg-white p-3">
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-100 to-stone-100 text-[10px] font-semibold text-stone-500">Demo</div>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{exercise.name}</p>
        <p className="text-sm text-stone-500">{exercise.sets} séries · {exercise.reps} · descanso {exercise.restSeconds}s{exercise.suggestedLoad ? ` · ${exercise.suggestedLoad}` : ""}</p>
        <p className="mt-1 text-sm text-stone-600">{exercise.tip}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={onHelp}>Como executar</Button>
          <Link to="/nina"><Button variant="ghost" className="px-3 py-1.5 text-xs">Pedir ajuda à Nina</Button></Link>
        </div>
      </div>
    </li>
  );
}

export function LiveClassCard({ item }: { item: LiveClass }) {
  const { reservations, reserve, toggleReminder } = useApp();
  const instructor = instructors.find((i) => i.id === item.instructorId);
  const reserved = reservations.some((r) => r.classId === item.id);
  const reminder = reservations.find((r) => r.classId === item.id)?.reminder;
  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
      <Cover tone={item.tone} label={item.category} />
      <div className="mt-3 flex items-start justify-between gap-2">
        <h3 className="font-display font-semibold">{item.title}</h3>
        {item.status === "live" && <Badge tone="live">AO VIVO</Badge>}
        {item.status === "recorded" && <Badge>Gravada</Badge>}
      </div>
      <p className="mt-1 text-sm text-stone-500">{item.date} · {item.time} · {item.durationMin} min</p>
      <p className="text-sm text-stone-600">{instructor?.name} · {item.level}</p>
      <p className="text-sm text-stone-500">{item.participants}/{item.spots} participantes</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {item.status === "live" && <Link to={`/ao-vivo/${item.id}`}><Button>Entrar na aula</Button></Link>}
        {item.status === "upcoming" && <Button onClick={() => reserve(item.id)}>{reserved ? "Cancelar reserva" : "Reservar vaga"}</Button>}
        {item.status === "recorded" && <Link to={`/ao-vivo/${item.id}`}><Button variant="secondary">Assistir gravação</Button></Link>}
        {item.status !== "recorded" && <Button variant="secondary" onClick={() => toggleReminder(item.id)}>{reminder ? "Lembrete ativo" : "Ativar lembrete"}</Button>}
      </div>
    </article>
  );
}

export function exerciseById(id: string) {
  return exercises.find((e) => e.id === id);
}
