/**
 * Visão computacional local (MediaPipe Pose Landmarker).
 * Não envia frames para o servidor — só métricas derivadas.
 */

import {
  FilesetResolver,
  PoseLandmarker,
  type NormalizedLandmark,
} from "@mediapipe/tasks-vision";

export type PoseMetrics = {
  score: number;
  reps: number;
  cues: string[];
  landmarksVisible: boolean;
};

let landmarker: PoseLandmarker | null = null;
let loadPromise: Promise<PoseLandmarker> | null = null;
let squatPhase: "up" | "down" = "up";
let squatReps = 0;

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export async function ensurePoseLandmarker(): Promise<PoseLandmarker> {
  if (landmarker) return landmarker;
  if (!loadPromise) {
    loadPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm",
      );
      landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      return landmarker;
    })();
  }
  return loadPromise;
}

function angle(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark,
): number {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const mag = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y) || 1;
  const cos = Math.min(1, Math.max(-1, dot / mag));
  return (Math.acos(cos) * 180) / Math.PI;
}

function visible(lm: NormalizedLandmark | undefined, min = 0.4): boolean {
  return Boolean(lm && (lm.visibility ?? 1) >= min);
}

export function resetPoseCounters() {
  squatPhase = "up";
  squatReps = 0;
}

export async function analyzeVideoFrame(
  video: HTMLVideoElement,
  exercise: string,
): Promise<PoseMetrics> {
  const detector = await ensurePoseLandmarker();
  const now = performance.now();
  const result = detector.detectForVideo(video, now);
  const pose = result.landmarks?.[0];
  if (!pose || pose.length < 29) {
    return {
      score: 0,
      reps: squatReps,
      cues: ["Corpo não detetado. Enquadra o corpo inteiro e melhora a luz."],
      landmarksVisible: false,
    };
  }

  const leftHip = pose[23];
  const leftKnee = pose[25];
  const leftAnkle = pose[27];
  const rightHip = pose[24];
  const rightKnee = pose[26];
  const rightAnkle = pose[28];
  const leftShoulder = pose[11];
  const rightShoulder = pose[12];

  const cues: string[] = [];
  let score = 70;

  const legsOk =
    visible(leftHip) &&
    visible(leftKnee) &&
    visible(leftAnkle) &&
    visible(rightHip) &&
    visible(rightKnee) &&
    visible(rightAnkle);

  if (!legsOk) {
    cues.push("Mantém ancas, joelhos e tornozelos visíveis.");
    score -= 20;
  }

  const kneeAngleL = legsOk ? angle(leftHip, leftKnee, leftAnkle) : 180;
  const kneeAngleR = legsOk ? angle(rightHip, rightKnee, rightAnkle) : 180;
  const kneeAvg = (kneeAngleL + kneeAngleR) / 2;

  const low = exercise.toLowerCase();
  if (low.includes("agach") || low.includes("afundo")) {
    if (kneeAvg < 140 && squatPhase === "up") {
      squatPhase = "down";
      cues.push("Boa descida — controla o movimento.");
    } else if (kneeAvg > 160 && squatPhase === "down") {
      squatPhase = "up";
      squatReps += 1;
      cues.push("Repetição contada. Empurra o chão com o pé inteiro.");
    }
    if (kneeAvg < 90) {
      cues.push("Evita descer em excesso se sentires desconforto.");
      score -= 10;
    } else if (kneeAvg > 100 && kneeAvg < 140) {
      score += 10;
    }
  } else if (low.includes("prancha")) {
    const shoulderY = ((leftShoulder?.y ?? 0) + (rightShoulder?.y ?? 0)) / 2;
    const hipY = ((leftHip?.y ?? 0) + (rightHip?.y ?? 0)) / 2;
    const delta = Math.abs(shoulderY - hipY);
    if (delta < 0.08) {
      score += 15;
      cues.push("Linha de tronco estável.");
    } else {
      score -= 15;
      cues.push("Alinha ombros e ancas — evita cair ou arquear.");
    }
  } else {
    cues.push("Mantém o tronco estável e respira de forma contínua.");
    if (legsOk) score += 5;
  }

  if (!cues.length) cues.push("Continua com controlo e amplitude confortável.");
  cues.push("Orientação educativa — não substitui profissional.");

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reps: squatReps,
    cues: cues.slice(0, 4),
    landmarksVisible: true,
  };
}

export function disposePoseLandmarker() {
  landmarker?.close();
  landmarker = null;
  loadPromise = null;
  resetPoseCounters();
}
