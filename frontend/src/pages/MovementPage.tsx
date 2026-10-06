import { useEffect, useRef, useState } from "react";
import { analyzeFrame } from "@/services/movementAnalysisService";
import { Button } from "@/components/ui/primitives";
import { PageHeader, SafetyNotice } from "@/components/ShellBits";

const options = ["Agachamento livre", "Flexão de braço", "Prancha", "Afundo", "Remada", "Desenvolvimento de ombro"];

export function MovementPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [exercise, setExercise] = useState(options[0]);
  const [consent, setConsent] = useState(false);
  const [camera, setCamera] = useState<"off" | "live" | "simulated">("off");
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [score, setScore] = useState(0);
  const [reps, setReps] = useState(0);
  const [cues, setCues] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const sessionIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(async () => {
      const res = await analyzeFrame({
        exercise,
        elapsedSeconds: seconds,
        sessionId: sessionIdRef.current,
        consentAccepted: consent,
      });
      if (res.sessionId) sessionIdRef.current = res.sessionId;
      setScore(res.score);
      setReps(res.reps);
      setCues(res.cues);
      setLog((l) => [`${res.reps} reps · ${res.cues[2] ?? res.cues[0]}`, ...l].slice(0, 5));
    }, 2000);
    return () => clearInterval(t);
  }, [running, exercise, seconds, consent]);

  const startCamera = async () => {
    if (!consent) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCamera("live");
    } catch {
      setCamera("simulated");
    }
  };

  const stop = () => {
    setRunning(false);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    setCamera("off");
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Vamos analisar seu movimento" subtitle="Posicione o corpo inteiro no enquadramento para receber orientações gerais de execução." />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => <button key={o} onClick={() => setExercise(o)} className={`rounded-full border px-3 py-1.5 text-sm ${exercise === o ? "border-[#e07a4a] bg-orange-50" : "border-stone-200 bg-white"}`}>{o}</button>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-stone-900">
          {camera === "live" ? <video ref={videoRef} autoPlay muted playsInline className="h-80 w-full object-cover" /> : <div className="grid h-80 place-items-center text-sm text-stone-300">{camera === "simulated" ? "Câmera simulada neste ambiente" : "Prévia da câmera"}</div>}
          <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-dashed border-white/70" />
          <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-1 text-xs">Iluminação ok</div>
          <div className="absolute right-3 top-3 rounded-full bg-white/90 px-2 py-1 text-xs">Corpo visível</div>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Feedback de postura</h2>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs">Demonstração — integração de visão computacional pendente</span>
          </div>
          <p className="mt-3 font-display text-4xl">{score || "—"}</p>
          <p className="text-sm text-stone-500">Pontuação demonstrativa · {reps} repetições</p>
          <ul className="mt-3 space-y-1 text-sm">{cues.map((c) => <li key={c}>• {c}</li>)}</ul>
          <p className="mt-3 text-xs text-stone-500">Histórico</p>
          <ul className="text-sm text-stone-600">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        Entendo que esta é uma análise orientativa e não substitui acompanhamento profissional.
      </label>
      <div className="flex flex-wrap gap-2">
        <Button disabled={!consent} onClick={startCamera}>Ativar câmera</Button>
        <Button disabled={camera === "off"} onClick={() => setRunning(true)}>Iniciar análise</Button>
        <Button variant="secondary" onClick={stop}>Parar análise</Button>
      </div>
      <SafetyNotice>A câmera é ativada somente com sua permissão. Não armazene imagens ou vídeos sem consentimento explícito. No MVP, a análise é demonstrativa.</SafetyNotice>
    </div>
  );
}
