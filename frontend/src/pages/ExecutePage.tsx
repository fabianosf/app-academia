import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { Button, Progress, Textarea } from "@/components/ui/primitives";
import { useApp } from "@/hooks/AppContext";
import { createSession } from "@/services/api";
import type { Exercise } from "@/types";

const difficulties = ["Muito fácil", "Fácil", "Ideal", "Difícil", "Muito difícil"] as const;

export function ExecutePage() {
  const { id } = useParams();
  const { workouts, exerciseById, toast, refreshTraining } = useApp();
  const workout = workouts.find((w) => w.id === id) ?? workouts[0];
  const list = useMemo(
    () => workout?.exerciseIds.map(exerciseById).filter(Boolean) as Exercise[],
    [workout, exerciseById],
  );
  const startedAt = useRef(new Date().toISOString());
  const [index, setIndex] = useState(0);
  const [setNo, setSetNo] = useState(1);
  const [rest, setRest] = useState(0);
  const [running, setRunning] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [difficulty, setDifficulty] = useState<(typeof difficulties)[number]>("Ideal");
  const [note, setNote] = useState("");
  const [music, setMusic] = useState(true);
  const exercise = list[index];

  useEffect(() => {
    if (!running || done || rest > 0) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running, done, rest]);

  useEffect(() => {
    if (rest <= 0) return;
    const t = setInterval(() => setRest((r) => r - 1), 1000);
    return () => clearInterval(t);
  }, [rest]);

  if (!workout || list.length === 0 || !exercise) {
    return <p className="text-sm text-stone-500">Treino não encontrado.</p>;
  }

  const finishSet = () => {
    if (setNo < exercise.sets) {
      setRest(exercise.restSeconds);
      setSetNo((n) => n + 1);
    } else if (index < list.length - 1) {
      setIndex((i) => i + 1);
      setSetNo(1);
    } else setDone(true);
  };

  if (done) {
    const mins = Math.max(1, Math.round(seconds / 60));
    return (
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-emerald-700">Concluído com cuidado</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">Treino concluído!</h1>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <Stat label="Tempo" value={`${mins} min`} />
          <Stat label="Exercícios" value={String(list.length)} />
          <Stat label="kcal" value={String(workout.calories)} />
        </div>
        <p className="mt-4 text-sm font-medium">Como foi a dificuldade?</p>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          {difficulties.map((d) => (
            <button key={d} onClick={() => setDifficulty(d)} className={`rounded-full border px-3 py-1.5 text-xs ${difficulty === d ? "border-[#e07a4a] bg-orange-50" : "border-stone-200"}`}>{d}</button>
          ))}
        </div>
        <Textarea className="mt-3" rows={3} placeholder="Observação opcional" value={note} onChange={(e) => setNote(e.target.value)} />
        <Link
          to="/"
          className="mt-4 inline-block"
          onClick={async (e) => {
            if (saving) {
              e.preventDefault();
              return;
            }
            setSaving(true);
            try {
              await createSession({
                workoutId: workout.id,
                startedAt: startedAt.current,
                finishedAt: new Date().toISOString(),
                completedExercises: list.length,
                difficulty,
                note,
                minutes: mins,
                calories: workout.calories,
                place: workout.place,
              });
              await refreshTraining();
              toast("Treino concluído.");
            } catch {
              e.preventDefault();
              toast("Não foi possível salvar o treino.");
              setSaving(false);
            }
          }}
        >
          <Button>{saving ? "Salvando…" : "Salvar e voltar ao início"}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-stone-500">Exercício {index + 1} de {list.length}</p>
      <Progress value={((index + (setNo - 1) / exercise.sets) / list.length) * 100} />
      <h1 className="mt-4 font-display text-3xl font-semibold">{exercise.name}</h1>
      <div className="mt-4 grid h-64 place-items-center rounded-3xl bg-gradient-to-br from-orange-100 via-white to-stone-100 text-stone-500">
        Área de vídeo / animação demonstrativa
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
        <Stat label="Série" value={`${setNo}/${exercise.sets}`} />
        <Stat label="Repetições" value={exercise.reps} />
        <Stat label="Carga" value={exercise.suggestedLoad ?? "corpo"} />
        <Stat label="Cronômetro" value={`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`} />
      </div>
      {rest > 0 && (
        <div className="mt-4 rounded-2xl bg-stone-900 p-5 text-center text-white">
          <p className="text-sm text-stone-300">Descanso</p>
          <p className="font-display text-4xl">{rest}s</p>
          <Button className="mt-3" variant="secondary" onClick={() => setRest(0)}>Pular descanso</Button>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setRunning((v) => !v)}>{running ? <Pause size={16} /> : <Play size={16} />} {running ? "Pausar" : "Retomar"}</Button>
        <Button variant="secondary" onClick={() => setIndex((i) => Math.max(0, i - 1))}><SkipBack size={16} /> Voltar</Button>
        <Button variant="secondary" onClick={() => setIndex((i) => Math.min(list.length - 1, i + 1))}><SkipForward size={16} /> Avançar</Button>
        <Button onClick={finishSet}>Concluir exercício</Button>
        <Link to={`/treinos/${workout.id}`}><Button variant="ghost">Ver execução</Button></Link>
        <Link to="/nina"><Button variant="ghost">Tirar dúvida com Nina</Button></Link>
        <Button variant="ghost" onClick={() => setMusic((m) => !m)}>{music ? "Música ligada" : "Música pausada"}</Button>
      </div>
      <p className="mt-4 text-sm text-stone-600">{exercise.tip}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-white p-3"><p className="text-xs text-stone-500">{label}</p><p className="font-semibold">{value}</p></div>;
}
