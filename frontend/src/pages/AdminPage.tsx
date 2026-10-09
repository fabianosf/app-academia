import { useCallback, useEffect, useState } from "react";
import { Button, Input, Textarea } from "@/components/ui/primitives";
import { PageHeader } from "@/components/ShellBits";
import { useApp } from "@/hooks/AppContext";
import {
  createExerciseApi,
  createLiveClassApi,
  createWorkoutApi,
  fetchDemos,
  patchSiteSettings,
  reviewDemoApi,
  type ExerciseDemoDto,
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
  const [reviewQueue, setReviewQueue] = useState<ExerciseDemoDto[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  const isAdmin = user.role === "admin" || !!user.isPlatformAdmin;

  const loadReviewQueue = useCallback(async () => {
    if (!isAdmin) {
      setReviewQueue([]);
      return;
    }
    setReviewLoading(true);
    try {
      const rows = await fetchDemos("review");
      setReviewQueue(rows);
    } catch {
      setReviewQueue([]);
    } finally {
      setReviewLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void refreshTraining();
  }, [refreshTraining]);

  useEffect(() => {
    void loadReviewQueue();
  }, [loadReviewQueue]);

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

  const review = async (demoId: string, action: "approve" | "reject") => {
    try {
      await reviewDemoApi(demoId, action);
      toast(action === "approve" ? "Demo aprovada." : "Demo rejeitada.");
      await loadReviewQueue();
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        toast("Apenas staff pode aprovar demos.");
      } else {
        toast("Falha ao rever a demo.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Administração"
        subtitle="Conteúdo, marca e revisão de demonstrações (requer conta staff)."
      />
      <p className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs text-stone-600">
        Sessão: {user.name}
        {user.role === "admin" || user.isPlatformAdmin
          ? " · administrador"
          : " · sem papel admin"}{" "}
        · gestão global e publicação exigem <strong>role=admin</strong>.
      </p>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display font-semibold">Demos em revisão</h2>
          <Button type="button" variant="ghost" onClick={() => void loadReviewQueue()}>
            Atualizar
          </Button>
        </div>
        {!isAdmin && (
          <p className="mt-2 text-sm text-stone-500">
            A tua conta não é administradora — a fila de aprovação não está disponível.
          </p>
        )}
        {isAdmin && reviewLoading && (
          <p className="mt-2 text-sm text-stone-500">A carregar fila…</p>
        )}
        {isAdmin && !reviewLoading && reviewQueue.length === 0 && (
          <p className="mt-2 text-sm text-stone-500">
            Nenhuma demo em revisão. Quando a geração de vídeo estiver configurada, os vídeos
            novos aparecem aqui até aprovares.
          </p>
        )}
        {isAdmin && (
          <ul className="mt-3 space-y-3">
            {reviewQueue.map((demo) => (
              <li
                key={demo.id}
                className="rounded-xl border border-stone-100 bg-stone-50 p-3 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {demo.exercise_name}
                      {demo.variation ? ` · ${demo.variation}` : ""}
                    </p>
                    <p className="text-xs text-stone-500">
                      {demo.duration_sec}s ·{" "}
                      {(demo as { persona?: string }).persona || "—"} ·{" "}
                      {demo.ai_generated ? "IA" : "manual"} · {demo.id}
                    </p>
                    {demo.structured_script?.length > 0 && (
                      <ol className="mt-2 list-decimal pl-4 text-xs text-stone-600">
                        {demo.structured_script.slice(0, 5).map((s, i) => (
                          <li key={`${demo.id}-${i}`}>{s}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" onClick={() => void review(demo.id, "approve")}>
                      Aprovar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => void review(demo.id, "reject")}
                    >
                      Rejeitar
                    </Button>
                  </div>
                </div>
                {demo.media_url ? (
                  <video
                    className="mt-3 max-h-48 w-full max-w-md rounded-lg bg-black"
                    controls
                    src={demo.media_url}
                  />
                ) : (
                  <p className="mt-2 text-xs text-amber-800">
                    Sem URL de vídeo ainda — podes rejeitar ou esperar o job concluir.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

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
        <h2 className="font-display font-semibold">Integrações</h2>
        <ul className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          {["Pagamentos", "Streaming ao vivo", "Visão computacional"].map((i) => (
            <li key={i} className="rounded-xl bg-white p-3">
              {i} · pendente
            </li>
          ))}
          <li className="rounded-xl bg-emerald-50 p-3 text-emerald-900">
            Auth JWT (cookies) · ativo
          </li>
          <li className="rounded-xl bg-emerald-50 p-3 text-emerald-900">Nina / demos · ativo</li>
          <li className="rounded-xl bg-amber-50 p-3 text-amber-950">
            Pesquisa web / vídeo avatar · ver docs/INTEGRACOES_ASSISTENTE.md
          </li>
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
