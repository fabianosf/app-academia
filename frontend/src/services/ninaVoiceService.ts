/** Web Speech API helpers (STT + TTS) for Nina — pt-BR. */

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((ev: Event) => void) | null;
  onend: ((ev: Event) => void) | null;
  onerror: ((ev: Event & { error?: string }) => void) | null;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
};

export type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Microfone / SpeechRecognition exigem HTTPS (ou localhost). */
export function isSecureVoiceContext() {
  return typeof window !== "undefined" && window.isSecureContext;
}

export function isSpeechRecognitionSupported() {
  return Boolean(getRecognitionCtor());
}

export function isSpeechSynthesisSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function voiceCapabilityMessage(): string | null {
  if (!isSecureVoiceContext()) {
    return "No celular, abra o app em HTTPS (ex.: https://IP:5173) e aceite o certificado para liberar o microfone.";
  }
  if (!isSpeechRecognitionSupported()) {
    return "Este navegador não tem ditado por voz (comum no iPhone). Use Chrome/Edge no Android, ou digite.";
  }
  return null;
}

/** Desbloqueia áudio no mobile (precisa de gesto do usuário). */
export function unlockSpeechAudio() {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
    const warm = new SpeechSynthesisUtterance(" ");
    warm.volume = 0;
    warm.rate = 2;
    window.speechSynthesis.speak(warm);
    window.speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

export async function ensureMicrophonePermission(): Promise<boolean> {
  if (!isSecureVoiceContext() || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

export function createSpeechRecognition(handlers: {
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (message: string) => void;
}): SpeechRecognitionLike | null {
  const Ctor = getRecognitionCtor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = "pt-BR";
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => handlers.onStart?.();
  recognition.onend = () => handlers.onEnd?.();
  recognition.onerror = (ev) => {
    const code = ev.error ?? "error";
    const map: Record<string, string> = {
      "not-allowed": "Permissão de microfone negada. Libere o microfone nas configurações do navegador/site.",
      "no-speech": "Não ouvi nada. Tente de novo.",
      "audio-capture": "Não encontrei um microfone disponível.",
      network: "Falha de rede no reconhecimento de voz.",
      aborted: "",
    };
    const msg = map[code] ?? "Não foi possível usar a voz neste momento.";
    if (msg) handlers.onError?.(msg);
  };
  recognition.onresult = (ev) => {
    let interim = "";
    let finalText = "";
    for (let i = ev.resultIndex; i < ev.results.length; i += 1) {
      const piece = ev.results[i][0].transcript;
      if (ev.results[i].isFinal) finalText += piece;
      else interim += piece;
    }
    if (interim) handlers.onInterim?.(interim);
    if (finalText.trim()) handlers.onFinal?.(finalText.trim());
  };

  return recognition;
}

function pickPtBrVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase() === "pt-br") ??
    voices.find((v) => v.lang.toLowerCase().startsWith("pt")) ??
    null
  );
}

export function speakText(text: string, opts?: { onEnd?: () => void }) {
  if (!isSpeechSynthesisSupported() || !text.trim()) {
    opts?.onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "pt-BR";
  utter.rate = 1;
  utter.pitch = 1;
  const voice = pickPtBrVoice();
  if (voice) utter.voice = voice;
  utter.onend = () => opts?.onEnd?.();
  utter.onerror = () => opts?.onEnd?.();
  // Chrome sometimes returns empty voices until voiceschanged
  if (!voice && window.speechSynthesis.getVoices().length === 0) {
    const speakWhenReady = () => {
      const v = pickPtBrVoice();
      if (v) utter.voice = v;
      window.speechSynthesis.speak(utter);
      window.speechSynthesis.removeEventListener("voiceschanged", speakWhenReady);
    };
    window.speechSynthesis.addEventListener("voiceschanged", speakWhenReady);
    // fallback se voiceschanged não disparar
    window.setTimeout(() => {
      if (!window.speechSynthesis.speaking) speakWhenReady();
    }, 250);
    return;
  }
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking() {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}
