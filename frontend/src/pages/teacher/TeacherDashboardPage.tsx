import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, SafetyNotice } from "@/components/ShellBits";
import { Button } from "@/components/ui/primitives";
import { ApiError } from "@/services/http";
import { fetchTeacherDashboard, type TeacherDashboard } from "@/services/api";

export function TeacherDashboardPage() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<TeacherDashboard | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTeacherDashboard(period)
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError("");
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? "Não foi possível carregar o painel." : "Erro de rede.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Painel do professor"
        subtitle="Indicadores dos alunos que te foram atribuídos, só com consentimento."
      />
      <div className="flex flex-wrap gap-2">
        {[
          { id: "7d", label: "7 dias" },
          { id: "30d", label: "30 dias" },
          { id: "90d", label: "90 dias" },
        ].map((p) => (
          <Button
            key={p.id}
            variant={period === p.id ? "primary" : "secondary"}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </Button>
        ))}
        <Link to="/professor/alunos">
          <Button variant="ghost">Ver alunos</Button>
        </Link>
      </div>
      {loading && <p className="text-sm text-stone-500">A carregar indicadores…</p>}
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {data && !loading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Alunos atribuídos" value={String(data.assignedStudents)} />
          <Metric
            label="Treinos concluídos"
            value={String(data.completedWorkouts)}
            hint="Sessões com finished_at"
          />
          <Metric
            label="Frequência semanal (média)"
            value={
              data.weeklyFrequencyAvg == null
                ? "Sem dados"
                : `${data.weeklyFrequencyAvg.toFixed(1)}x`
            }
          />
          <Metric label="Minutos treinados" value={String(data.minutesTrained)} />
        </div>
      )}

      {data && !loading && (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border border-stone-200 bg-white p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Resumo do acompanhamento</p>
            <h3 className="mt-2 font-display text-2xl font-semibold text-[#1f2c27]">
              {data.assignedStudents === 0
                ? "Aguardando atribuição"
                : `${data.assignedStudents} aluno(s) em acompanhamento`}
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              <li>• {data.completedWorkouts} treinos concluídos no período selecionado.</li>
              <li>
                • {data.weeklyFrequencyAvg == null ? "Ainda não há média suficiente" : `Média de ${data.weeklyFrequencyAvg.toFixed(1)} sessões por semana`}.
              </li>
              <li>
                • {data.incomplete.length > 0 ? `${data.incomplete.length} alunos precisam de consentimento adicional.` : "Consentimento e tracking em linha com o necessário."}
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-[#faf7f5] p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Ações recomendadas</p>
            <ul className="mt-3 space-y-2 text-sm text-stone-700">
              <li>• Revisar alunos com menor aderência à semana.</li>
              <li>• Ajustar volume de treino para quem tem mais carga na sessão.</li>
              <li>• Priorizar checkpoints de recuperação e progressão.</li>
            </ul>
          </div>
        </div>
      )}

      {data?.incomplete?.length ? (
        <p className="text-sm text-amber-900">
          {data.incomplete.length} aluno(s) sem consentimento suficiente para algumas métricas.
        </p>
      ) : null}
      {data?.assignedStudents === 0 && !loading && (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-600">
          Ainda não tens alunos atribuídos. Pede a um administrador que faça a atribuição.
        </p>
      )}
      {data?.notes?.length ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-stone-500">Notas de acompanhamento</p>
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            {data.notes.slice(0, 4).map((note, index) => (
              <li key={`${note}-${index}`} className="rounded-xl bg-stone-50 px-3 py-2">
                {note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <SafetyNotice>
        Não mostramos limitações de saúde, conversas com a Aster nem notas privadas. Os gráficos
        usam apenas registos reais no período da atribuição ativa.
      </SafetyNotice>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-[#1f2c27]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-stone-500">{hint}</p> : null}
    </div>
  );
}
