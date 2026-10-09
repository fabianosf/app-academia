import { useState } from "react";
import { PageHeader, SafetyNotice } from "@/components/ShellBits";
import { Button, Input } from "@/components/ui/primitives";
import { useApp } from "@/hooks/AppContext";
import { createWorkoutApi } from "@/services/api";
import { ApiError } from "@/services/http";

export function TeacherContentPage() {
  const { refreshTraining, toast, workouts } = useApp();
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const drafts = workouts.filter((w) => (w as { publishStatus?: string }).publishStatus === "draft");

  const createDraft = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await createWorkoutApi({ name: title.trim(), description: "Rascunho do professor" });
      setTitle("");
      await refreshTraining();
      toast("Rascunho criado. Um administrador precisa publicar.");
    } catch (err) {
      toast(
        err instanceof ApiError && err.status === 403
          ? "Sem permissão para criar rascunhos."
          : "Não foi possível criar o rascunho.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Conteúdos"
        subtitle="Podes criar e editar rascunhos. Só o administrador publica."
      />
      <div className="flex flex-wrap gap-2 rounded-2xl border border-stone-200 bg-white p-4">
        <Input
          aria-label="Nome do treino"
          placeholder="Nome do treino (rascunho)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-w-[12rem] flex-1"
        />
        <Button disabled={saving || !title.trim()} onClick={() => void createDraft()}>
          Criar rascunho
        </Button>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="font-display text-lg font-semibold">Os teus rascunhos / publicados</h2>
        {workouts.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Sem conteúdos visíveis.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {workouts.slice(0, 30).map((w) => (
              <li key={w.id}>
                {w.name}{" "}
                <span className="text-xs text-stone-500">
                  ({(w as { publishStatus?: string }).publishStatus || "publicado"})
                </span>
              </li>
            ))}
          </ul>
        )}
        {drafts.length === 0 && (
          <p className="mt-2 text-xs text-stone-500">
            Rascunhos novos aparecem após o administrador ou após refrescar o catálogo.
          </p>
        )}
      </div>
      <SafetyNotice>
        Publicar, despublicar ou arquivar exige papel de administrador.
      </SafetyNotice>
    </div>
  );
}
