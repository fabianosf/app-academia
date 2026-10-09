import { useEffect, useRef, useState } from "react";
import { analyzeFrame } from "@/services/movementAnalysisService";
import {
  analyzeVideoFrame,
  disposePoseLandmarker,
  ensurePoseLandmarker,
  resetPoseCounters,
} from "@/services/movementPoseService";
import { Button } from "@/components/ui/primitives";
import { PageHeader, SafetyNotice } from "@/components/ShellBits";

const options = [
  "Agachamento livre",
  "Flexão de braço",
  "Prancha",
  "Afundo",
  "Remada",
  "Desenvolvimento de ombro",
];

export function MovementPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [exercise, setExercise] = useState(options[0]);
  const [consent, setConsent] = useState(false);
  const [camera, setCamera] = useState<"off" | "live" | "denied">("off");
  const [poseReady, setPoseReady] = useState(false);
  const [poseError, setPoseError] = useState("");
  const [running, setRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [score, setScore] = useState(0);
  const [reps, setReps] = useState(0);
  const [cues, setCues] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const sessionIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((t) => t.stop());
      disposePoseLandmarker();
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running]);

  useEffect(() => {
    if (!running || camera !== "live") return;
    let cancelled = false;
    const tick = async () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) return;
      try {
        const metrics = await analyzeVideoFrame(video, exercise);
        if (cancelled) return;
        setScore(metrics.score);
        setReps(metrics.reps);
        setCues(metrics.cues);
        setLog((l) =>
          [`${metrics.reps} reps · ${metrics.cues[0] ?? "ok"}`, ...l].slice(0, 5),
        );
        const res = await analyzeFrame({
          exercise,
          elapsedSeconds: seconds,
          sessionId: sessionIdRef.current,
          consentAccepted: consent,
          score: metrics.score,
          reps: metrics.reps,
          cues: metrics.cues,
          source: "client_pose",
        });
        if (res.sessionId) sessionIdRef.current = res.sessionId;
      } catch (err) {
        if (!cancelled) {
          setPoseError(
            err instanceof Error ? err.message : "Falha na análise de pose.",
          );
        }
      }
    };
    const id = window.setInterval(() => void tick(), 900);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [running, camera, exercise, seconds, consent]);

  const startCamera = async () => {
    if (!consent) return;
    setPoseError("");
    try {
      await ensurePoseLandmarker();
      setPoseReady(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamera("live");
    } catch (err) {
      setCamera("denied");
      setPoseError(
        err instanceof Error
          ? err.message
          : "Não foi possível ativar a câmera ou carregar o modelo de pose.",
      );
    }
  };

  const startAnalysis = () => {
    resetPoseCounters();
    setSeconds(0);
    setReps(0);
    setScore(0);
    setCues([]);
    setRunning(true);
  };

  const stop = () => {
    setRunning(false);
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamera("off");
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Análise de movimento"
        subtitle="Pose estimada no teu dispositivo (MediaPipe). Imagens não são enviadas ao servidor."
      />
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => setExercise(o)}
            className={`rounded-full border px-3 py-1.5 text-sm ${
              exercise === o ? "border-[#e07a4a] bg-orange-50" : "border-stone-200 bg-white"
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="relative overflow-hidden rounded-3xl border border-stone-200 bg-stone-900">
          {camera === "live" ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-80 w-full object-cover"
            />
          ) : (
            <div className="grid h-80 place-items-center text-sm text-stone-300">
              {camera === "denied"
                ? "Câmera ou modelo de pose indisponível"
                : "Prévia da câmera"}
            </div>
          )}
          <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-dashed border-white/70" />
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Feedback de postura</h2>
            <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-900">
              {poseReady ? "MediaPipe ativo" : "CV local"}
            </span>
          </div>
          <p className="mt-3 font-display text-4xl">{score || "—"}</p>
          <p className="text-sm text-stone-500">
            Pontuação orientativa · {reps} repetições · {seconds}s
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {cues.map((c) => (
              <li key={c}>• {c}</li>
            ))}
          </ul>
          {poseError && <p className="mt-2 text-sm text-rose-700">{poseError}</p>}
          <p className="mt-3 text-xs text-stone-500">Histórico</p>
          <ul className="text-sm text-stone-600">
            {log.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        Autorizo o uso da câmera neste dispositivo para estimar pose. Entendo que é
        orientação educativa e não substitui acompanhamento profissional. Frames não são
        enviados ao servidor.
      </label>
      <div className="flex flex-wrap gap-2">
        <Button disabled={!consent} onClick={() => void startCamera()}>
          Ativar câmera + pose
        </Button>
        <Button disabled={camera !== "live" || running} onClick={startAnalysis}>
          Iniciar análise
        </Button>
        <Button variant="secondary" onClick={stop}>
          Parar
        </Button>
      </div>
      <SafetyNotice>
        A análise corre no browser com MediaPipe. O backend só recebe métricas numéricas
        (score/reps/cues) com o teu consentimento — não recebe vídeo.
      </SafetyNotice>
    </div>
  );
}
