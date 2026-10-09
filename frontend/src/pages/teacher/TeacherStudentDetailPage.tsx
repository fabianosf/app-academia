import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PageHeader, SafetyNotice } from "@/components/ShellBits";
import { Button } from "@/components/ui/primitives";
import { fetchTeacherStudentDetail, type TeacherStudentDetail } from "@/services/api";

export function TeacherStudentDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<TeacherStudentDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    fetchTeacherStudentDetail(Number(id))
      .then((d) => {
        if (!cancelled) {
          setData(d);
          setError("");
        }
      })
      .catch(() => {
        if (!cancelled) setError("Aluno indisponível ou sem atribuição.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PageHeader
          title={data?.student.name || "Aluno"}
          subtitle="Dados autorizados desde o início da atribuição atual."
        />
        <Link to="/professor/alunos">
          <Button variant="secondary">Voltar</Button>
        </Link>
      </div>
      {loading && <p className="text-sm text-stone-500">A carregar…</p>}
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {data && (
        <>
          <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm sm:grid-cols-2">
            <p>
              <span className="text-stone-500">Objetivo</span>
              <br />
              {data.student.goal || "—"}
            </p>
            <p>
              <span className="text-stone-500">Nível</span>
              <br />
              {data.student.level || "—"}
            </p>
            <p>
              <span className="text-stone-500">Local</span>
              <br />
              {data.student.place || "—"}
            </p>
            <p>
              <span className="text-stone-500">Atribuição desde</span>
              <br />
              {new Date(data.student.assignmentStartedAt).toLocaleString("pt-BR")}
            </p>
          </div>
          {data.gaps.length > 0 && (
            <ul className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
              {data.gaps.map((g) => (
                <li key={g}>• {g}</li>
              ))}
            </ul>
          )}
          {data.charts.sessions && (
            <section className="rounded-2xl border border-stone-200 bg-white p-4">
              <h2 className="font-display text-lg font-semibold">Sessões concluídas</h2>
              {data.charts.sessions.length === 0 ? (
                <p className="mt-2 text-sm text-stone-500">Sem sessões no período da atribuição.</p>
              ) : (
                <ul className="mt-2 max-h-64 space-y-1 overflow-auto text-sm">
                  {data.charts.sessions.map((s) => (
                    <li key={s.id}>
                      {s.date} · {s.workoutName} · {s.minutes} min
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          {data.charts.frequencyByWeek && (
            <section className="rounded-2xl border border-stone-200 bg-white p-4">
              <h2 className="font-display text-lg font-semibold">Frequência por semana</h2>
              {data.charts.frequencyByWeek.length === 0 ? (
                <p className="mt-2 text-sm text-stone-500">Sem dados suficientes para o gráfico.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {data.charts.frequencyByWeek.map((w) => (
                    <li key={w.week}>
                      {w.week}: {w.completed} treino(s)
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          {data.charts.goals && (
            <section className="rounded-2xl border border-stone-200 bg-white p-4">
              <h2 className="font-display text-lg font-semibold">Metas</h2>
              {data.charts.goals.length === 0 ? (
                <p className="mt-2 text-sm text-stone-500">Sem metas partilhadas.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm">
                  {data.charts.goals.map((g) => (
                    <li key={g.id}>
                      {g.label}: {g.current}/{g.target} {g.unit}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
      <SafetyNotice>
        Limitaciones físicas e conversas com a Nina não estão disponíveis neste painel.
      </SafetyNotice>
    </div>
  );
}
