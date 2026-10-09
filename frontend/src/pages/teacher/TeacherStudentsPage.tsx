import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ShellBits";
import { Input } from "@/components/ui/primitives";
import { fetchTeacherStudents, type TeacherStudentRow } from "@/services/api";

export function TeacherStudentsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<TeacherStudentRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      setLoading(true);
      fetchTeacherStudents(q)
        .then((r) => {
          if (!cancelled) {
            setRows(r.results);
            setError("");
          }
        })
        .catch(() => {
          if (!cancelled) setError("Não foi possível listar os alunos.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Os teus alunos"
        subtitle="Apenas alunos formalmente atribuídos a ti."
      />
      <Input
        aria-label="Pesquisar alunos"
        placeholder="Nome ou e-mail"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {loading && <p className="text-sm text-stone-500">A carregar…</p>}
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {!loading && rows.length === 0 && (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-600">
          Nenhum aluno atribuído{q ? " para esta pesquisa" : ""}.
        </p>
      )}
      <ul className="space-y-2">
        {rows.map((s) => (
          <li key={s.id}>
            <Link
              to={`/professor/alunos/${s.id}`}
              className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm transition hover:border-[#e07a4a]"
            >
              <span>
                <span className="font-medium">{s.name}</span>
                <span className="ml-2 text-stone-500">{s.email}</span>
              </span>
              <span className="text-xs text-stone-500">
                {s.consents.length
                  ? `${s.consents.length} consentimento(s)`
                  : "Sem partilha"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
