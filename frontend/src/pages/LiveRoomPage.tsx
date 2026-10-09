import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button } from "@/components/ui/primitives";
import { SafetyNotice } from "@/components/ShellBits";
import { useApp } from "@/hooks/AppContext";

export function LiveRoomPage() {
  const { id } = useParams();
  const { liveClasses, instructors, user } = useApp();
  const item = liveClasses.find((c) => c.id === id) ?? liveClasses[0];
  const teacher = instructors.find((i) => i.id === item?.instructorId);
  const [chat, setChat] = useState([
    { from: "Sistema", text: "Bem-vindo à sala. Usa o chat para interagir com a turma." },
  ]);
  const [text, setText] = useState("");
  const [hand, setHand] = useState(false);
  const [mic, setMic] = useState(false);
  const [cam, setCam] = useState(false);
  const [full, setFull] = useState(false);

  if (!item) return <p className="text-sm text-stone-500">Aula não encontrada.</p>;

  const streamUrl = (item.streamUrl || "").trim();
  const hasStream = Boolean(item.streamConfigured && streamUrl);
  const isHlsOrFile = /\.(m3u8|mp4)(\?|$)/i.test(streamUrl);

  return (
    <div className={full ? "fixed inset-0 z-50 bg-[#f7f4ef] p-4" : ""}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <Badge tone="live">{item.status === "live" ? "AO VIVO" : item.status.toUpperCase()}</Badge>
          <h1 className="mt-2 font-display text-2xl font-semibold">{item.title}</h1>
          <p className="text-sm text-stone-500">
            {teacher?.name}
            {hasStream ? " · stream configurado" : " · stream não configurado"}
          </p>
        </div>
        <Link to="/ao-vivo">
          <Button variant="danger">Sair</Button>
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="min-h-72 overflow-hidden rounded-3xl bg-stone-900 text-stone-300">
          {hasStream ? (
            isHlsOrFile ? (
              <video
                className="h-full min-h-72 w-full object-contain"
                controls
                autoPlay
                playsInline
                src={streamUrl}
              />
            ) : (
              <iframe
                title={`Stream ${item.title}`}
                src={streamUrl}
                className="h-[min(70vh,28rem)] w-full border-0"
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                allowFullScreen
              />
            )
          ) : (
            <div className="grid min-h-72 place-items-center gap-2 p-6 text-center text-sm">
              <p className="font-medium text-white">Transmissão não configurada</p>
              <p className="max-w-md text-stone-400">
                Define <code className="text-stone-200">streamUrl</code> nesta aula (Django admin
                ou API staff) com o embed do LiveKit, Daily, YouTube Live, etc. Até lá a sala
                funciona só com chat local.
              </p>
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-3">
          <p className="text-sm font-semibold">Chat da sala</p>
          <ul className="mt-2 max-h-48 space-y-2 overflow-auto text-sm">
            {chat.map((m, i) => (
              <li key={i}>
                <span className="font-medium">{m.from}: </span>
                {m.text}
              </li>
            ))}
          </ul>
          <form
            className="mt-2 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              setChat((c) => [...c, { from: user.name || "Você", text }]);
              setText("");
            }}
          >
            <input
              aria-label="Mensagem"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
            <Button type="submit">Enviar</Button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {["👏", "🔥", "💪"].map((r) => (
              <button
                key={r}
                className="rounded-full bg-stone-100 px-3 py-1"
                onClick={() => setChat((c) => [...c, { from: user.name || "Você", text: r }])}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setHand((v) => !v)}>
          {hand ? "Mão levantada" : "Levantar a mão"}
        </Button>
        <Button variant="secondary" onClick={() => setMic((v) => !v)}>
          {mic ? "Microfone ligado" : "Microfone mudo"}
        </Button>
        <Button variant="secondary" onClick={() => setCam((v) => !v)}>
          {cam ? "Câmera ligada" : "Câmera desligada"}
        </Button>
        <Button variant="secondary" onClick={() => setFull((v) => !v)}>
          {full ? "Sair da tela cheia" : "Tela cheia"}
        </Button>
      </div>
      <div className="mt-4">
        <SafetyNotice>
          Chat é local nesta versão. O vídeo ao vivo só aparece quando a aula tem{" "}
          <strong>streamUrl</strong> configurada — sem URL não inventamos transmissão.
        </SafetyNotice>
      </div>
    </div>
  );
}
