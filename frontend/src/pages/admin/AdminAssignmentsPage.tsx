import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ShellBits";
import { Button } from "@/components/ui/primitives";
import {
  createAdminAssignment,
  endAdminAssignment,
  fetchAdminAssignments,
  fetchAdminUsers,
  type AdminUserRow,
} from "@/services/api";
import { useApp } from "@/hooks/AppContext";

export function AdminAssignmentsPage() {
  const { toast } = useApp();
  const [teachers, setTeachers] = useState<AdminUserRow[]>([]);
  const [students, setStudents] = useState<AdminUserRow[]>([]);
  const [teacherId, setTeacherId] = useState<number | "">("");
  const [studentId, setStudentId] = useState<number | "">("");
  const [rows, setRows] = useState<
    {
      id: number;
      teacher: AdminUserRow;
      student: AdminUserRow;
      startedAt: string;
      active: boolean;
    }[]
  >([]);

  const load = () => {
    void fetchAdminAssignments().then((r) => setRows(r.results.filter((x) => x.active)));
    void fetchAdminUsers("teacher").then((r) => setTeachers(r.results));
    void fetchAdminUsers("student").then((r) => setStudents(r.results));
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Atribuições professor ↔ aluno"
        subtitle="Histórico preservado ao mudar de professor. O novo só vê dados desde a nova atribuição."
      />
      <div className="flex flex-wrap gap-2 rounded-2xl border border-stone-200 bg-white p-4">
        <select
          className="rounded-xl border border-stone-200 px-3 py-2 text-sm"
          value={teacherId}
          onChange={(e) => setTeacherId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Professor</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name || t.username}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border border-stone-200 px-3 py-2 text-sm"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Aluno</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name || s.username}
            </option>
          ))}
        </select>
        <Button
          disabled={!teacherId || !studentId}
          onClick={() =>
            void createAdminAssignment(Number(teacherId), Number(studentId))
              .then(() => {
                toast("Atribuição criada.");
                load();
              })
              .catch(() => toast("Falha na atribuição."))
          }
        >
          Atribuir
        </Button>
      </div>
      <ul className="space-y-2">
        {rows.length === 0 && (
          <li className="rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-sm text-stone-600">
            Sem atribuições ativas.
          </li>
        )}
        {rows.map((a) => (
          <li
            key={a.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
          >
            <span>
              {a.teacher.name} → {a.student.name}{" "}
              <span className="text-stone-500">
                desde {new Date(a.startedAt).toLocaleDateString("pt-BR")}
              </span>
            </span>
            <Button
              variant="danger"
              onClick={() =>
                void endAdminAssignment(a.id)
                  .then(() => {
                    toast("Atribuição encerrada.");
                    load();
                  })
                  .catch(() => toast("Falha ao encerrar."))
              }
            >
              Encerrar
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
