import { useState } from "react";
import { Button, Input, Textarea } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ShellBits";
import { useApp } from "@/hooks/AppContext";
import { patchSiteSettings } from "@/services/api";

const users = [
  { name: "Fabiano Freitas", plan: "Completo", status: "Ativo" },
  { name: "Camila Rocha", plan: "Essencial", status: "Ativo" },
  { name: "Diego Alves", plan: "Completo", status: "Pausa" },
];

export function AdminPage() {
  const { brand, setBrand, ninaNote, setNinaNote, toast, workouts, exercises, liveClasses } = useApp();
  const [open, setOpen] = useState<"treino" | "exercicio" | "aula" | null>(null);
  const [title, setTitle] = useState("");
  const [localWorkouts, setLocalWorkouts] = useState(workouts.map((w) => w.name));
  const [localExercises, setLocalExercises] = useState(exercises.map((e) => e.name));
  const [localClasses, setLocalClasses] = useState(liveClasses.map((c) => c.title));

  const save = () => {
    if (!title.trim() || !open) return;
    if (open === "treino") setLocalWorkouts((l) => [title, ...l]);
    if (open === "exercicio") setLocalExercises((l) => [title, ...l]);
    if (open === "aula") setLocalClasses((l) => [title, ...l]);
    setTitle("");
    setOpen(null);
    toast("Registro salvo localmente.");
  };

  const saveBrand = async () => {
    try {
      const s = await patchSiteSettings({ brandName: brand, ninaAvatarNote: ninaNote });
      setBrand(s.brandName);
      setNinaNote(s.ninaAvatarNote);
      toast("Marca atualizada.");
    } catch {
      toast("Sem permissão de admin ou API indisponível.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Administração" subtitle="Ajustes da marca, conteúdos e integrações futuras." />
      <section className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 md:grid-cols-2">
        <label className="text-sm">Nome da marca<Input className="mt-1" value={brand} onChange={(e) => setBrand(e.target.value)} /></label>
        <label className="text-sm">Logo (arquivo local, não enviado)<Input className="mt-1" type="file" accept="image/*" onChange={() => toast("Logo selecionada para pré-visualização futura.")} /></label>
        <label className="text-sm md:col-span-2">Avatar da Nina<Input className="mt-1" value={ninaNote} onChange={(e) => setNinaNote(e.target.value)} /></label>
        <div className="md:col-span-2">
          <Button onClick={saveBrand}>Salvar marca na API</Button>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOpen("treino")}>Criar treino</Button>
        <Button variant="secondary" onClick={() => setOpen("exercicio")}>Criar exercício</Button>
        <Button variant="secondary" onClick={() => setOpen("aula")}>Criar aula</Button>
      </div>
      {open && (
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="font-medium">Novo {open}</p>
          <Input className="mt-2" placeholder="Nome" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea className="mt-2" rows={3} placeholder="Descrição breve" />
          <div className="mt-2 flex gap-2"><Button onClick={save}>Salvar</Button><Button variant="ghost" onClick={() => setOpen(null)}>Cancelar</Button></div>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <List title="Treinos" items={localWorkouts} />
        <List title="Exercícios" items={localExercises} />
        <List title="Aulas" items={localClasses} />
      </div>
      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="font-display font-semibold">Usuários fictícios</h2>
        <ul className="mt-2 text-sm">{users.map((u) => <li key={u.name} className="flex justify-between border-b border-stone-100 py-2"><span>{u.name}</span><span>{u.plan} · {u.status}</span></li>)}</ul>
      </section>
      <section className="rounded-2xl border border-dashed border-stone-300 p-4">
        <h2 className="font-display font-semibold">Integrações futuras</h2>
        <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          {["Autenticação", "Banco de dados", "IA", "Pagamentos", "Streaming", "Visão computacional"].map((i) => <li key={i} className="rounded-xl bg-white p-3">{i} · pendente</li>)}
        </ul>
      </section>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <h2 className="font-display font-semibold">{title}</h2>
      <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-sm text-stone-600">{items.map((i) => <li key={i}>{i}</li>)}</ul>
    </div>
  );
}
