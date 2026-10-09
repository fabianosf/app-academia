import { useEffect, useState } from "react";
import { Button, Input, Textarea } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ShellBits";
import { useApp } from "@/hooks/AppContext";
import {
  createExerciseApi,
  createLiveClassApi,
  createWorkoutApi,
  patchSiteSettings,
} from "@/services/api";
import { ApiError } from "@/services/http";

export function AdminPage() {
  const {
    brand,
    setBrand,
    ninaNote,
    setNinaNote,
    toast,
    workouts,
    exercises,
    liveClasses,
    refreshTraining,
    user,
  } = useApp();
  const [open, setOpen] = useState<"treino" | "exercicio" | "aula" | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void refreshTraining();
  }, [refreshTraining]);

  const save = async () => {
    if (!title.trim() || !open) return;
    setSaving(true);
    try {
      if (open === "treino") {
        await createWorkoutApi({ name: title.trim(), description: description.trim() });
      } else if (open === "exercicio") {
        await createExerciseApi({
          name: title.trim(),
          tip: description.trim(),
        });
      } else {
        await createLiveClassApi({
          title: title.trim(),
          category: description.trim() || "Geral",
        });
      }
      await refreshTraining();
      setTitle("");
      setDescription("");
      setOpen(null);
      toast("Registro salvo na API.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast("Sem permissão de staff/admin para criar conteúdo.");
      } else {
        toast("Não foi possível salvar. Verifique a API e permissões.");
      }
    } finally {
      setSaving(false);
    }
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
      <PageHeader
        title="Administração"
        subtitle="Conteúdo e marca persistidos na API (requer conta staff)."
      />
      <p className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
        Sessão: {user.name} · criações de treino/exercício/aula exigem{" "}
        <strong>is_staff</strong>. A conta demo local já é staff.
      </p>
      <section className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 md:grid-cols-2">
        <label className="text-sm">
          Nome da marca
          <Input className="mt-1" value={brand} onChange={(e) => setBrand(e.target.value)} />
        </label>
        <label className="text-sm">
          Logo (arquivo local, não enviado)
          <Input
            className="mt-1"
            type="file"
            accept="image/*"
            onChange={() => toast("Logo selecionada para pré-visualização futura.")}
          />
        </label>
        <label className="text-sm md:col-span-2">
          Avatar da Nina
          <Input className="mt-1" value={ninaNote} onChange={(e) => setNinaNote(e.target.value)} />
        </label>
        <div className="md:col-span-2">
          <Button onClick={saveBrand}>Salvar marca na API</Button>
        </div>
      </section>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => setOpen("treino")}>Criar treino</Button>
        <Button variant="secondary" onClick={() => setOpen("exercicio")}>
          Criar exercício
        </Button>
        <Button variant="secondary" onClick={() => setOpen("aula")}>
          Criar aula
        </Button>
      </div>
      {open && (
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="font-medium">Novo {open}</p>
          <Input
            className="mt-2"
            placeholder="Nome"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            className="mt-2"
            rows={3}
            placeholder={open === "aula" ? "Categoria (opcional)" : "Descrição breve"}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <Button onClick={() => void save()} disabled={saving || !title.trim()}>
              {saving ? "Salvando…" : "Salvar na API"}
            </Button>
            <Button variant="ghost" onClick={() => setOpen(null)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        <List title="Treinos" items={workouts.map((w) => w.name)} />
        <List title="Exercícios" items={exercises.map((e) => e.name)} />
        <List title="Aulas" items={liveClasses.map((c) => c.title)} />
      </div>
      <section className="rounded-2xl border border-dashed border-stone-300 p-4">
        <h2 className="font-display font-semibold">Integrações futuras</h2>
        <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          {["Pagamentos", "Streaming ao vivo", "Visão computacional"].map((i) => (
            <li key={i} className="rounded-xl bg-white p-3">
              {i} · pendente
            </li>
          ))}
          <li className="rounded-xl bg-emerald-50 p-3 text-emerald-900">
            Auth JWT (cookies) · ativo
          </li>
          <li className="rounded-xl bg-emerald-50 p-3 text-emerald-900">Banco / API · ativo</li>
          <li className="rounded-xl bg-emerald-50 p-3 text-emerald-900">Nina / ANS · ativo</li>
        </ul>
      </section>
    </div>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <h2 className="font-display font-semibold">{title}</h2>
      <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-sm text-stone-600">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
