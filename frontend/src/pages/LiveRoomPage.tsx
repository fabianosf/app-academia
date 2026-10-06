import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button } from "@/components/ui/primitives";
import { SafetyNotice } from "@/components/ShellBits";
import { useApp } from "@/hooks/AppContext";

const people = ["Marina", "Você", "Ana", "João", "Lúcia"];

export function LiveRoomPage() {
  const { id } = useParams();
  const { liveClasses, instructors } = useApp();
  const item = liveClasses.find((c) => c.id === id) ?? liveClasses[0];
  const teacher = instructors.find((i) => i.id === item?.instructorId);
  const [chat, setChat] = useState([{ from: "Marina", text: "Vamos começar devagar. Ajuste o colchonete." }]);
  const [text, setText] = useState("");
  const [hand, setHand] = useState(false);
  const [mic, setMic] = useState(false);
  const [cam, setCam] = useState(false);
  const [full, setFull] = useState(false);
  if (!item) return <p className="text-sm text-stone-500">Aula não encontrada.</p>;
  return (
    <div className={full ? "fixed inset-0 z-50 bg-[#f7f4ef] p-4" : ""}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <Badge tone="live">AO VIVO</Badge>
          <h1 className="mt-2 font-display text-2xl font-semibold">{item.title}</h1>
          <p className="text-sm text-stone-500">{teacher?.name} · conexão estável</p>
        </div>
        <Link to="/ao-vivo"><Button variant="danger">Sair</Button></Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <div className="grid min-h-72 place-items-center rounded-3xl bg-stone-900 text-stone-300">Player de vídeo simulado</div>
        <div className="rounded-2xl border border-stone-200 bg-white p-3">
          <p className="text-sm font-semibold">Chat</p>
          <ul className="mt-2 max-h-48 space-y-2 overflow-auto text-sm">
            {chat.map((m, i) => <li key={i}><span className="font-medium">{m.from}: </span>{m.text}</li>)}
          </ul>
          <form className="mt-2 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; setChat((c) => [...c, { from: "Você", text }]); setText(""); }}>
            <input aria-label="Mensagem" value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded-xl border border-stone-200 px-3 py-2 text-sm" />
            <Button type="submit">Enviar</Button>
          </form>
          <p className="mt-3 text-sm font-semibold">Participantes</p>
          <p className="text-sm text-stone-600">{people.join(", ")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["👏", "🔥", "💪"].map((r) => <button key={r} className="rounded-full bg-stone-100 px-3 py-1" onClick={() => setChat((c) => [...c, { from: "Você", text: r }])}>{r}</button>)}
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setHand((v) => !v)}>{hand ? "Mão levantada" : "Levantar a mão"}</Button>
        <Button variant="secondary" onClick={() => setMic((v) => !v)}>{mic ? "Microfone ligado" : "Microfone mudo"}</Button>
        <Button variant="secondary" onClick={() => setCam((v) => !v)}>{cam ? "Câmera ligada" : "Câmera desligada"}</Button>
        <Button variant="secondary" onClick={() => setFull((v) => !v)}>{full ? "Sair da tela cheia" : "Tela cheia"}</Button>
      </div>
      <div className="mt-4"><SafetyNotice>A transmissão ao vivo é uma interface demonstrativa. Integre posteriormente com LiveKit, Daily, Agora ou Zoom SDK.</SafetyNotice></div>
    </div>
  );
}
