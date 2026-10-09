import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ShellBits";
import { Button, Input } from "@/components/ui/primitives";
import {
  fetchAdminUsers,
  setAdminUserRole,
  type AdminUserRow,
} from "@/services/api";
import { useApp } from "@/hooks/AppContext";

export function AdminUsersPage() {
  const { toast } = useApp();
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState("");

  const load = () => {
    fetchAdminUsers(role || undefined, q || undefined)
      .then((r) => {
        setRows(r.results);
        setError("");
      })
      .catch(() => setError("Sem permissão ou falha ao listar utilizadores."));
  };

  useEffect(() => {
    load();
  }, [role]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Utilizadores"
        subtitle="Define papéis. Não há promoção automática na migração."
      />
      <div className="flex flex-wrap gap-2">
        <Input
          aria-label="Pesquisar"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nome, e-mail ou username"
          className="min-w-[12rem] flex-1"
        />
        <select
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="student">Alunos</option>
          <option value="teacher">Professores</option>
          <option value="admin">Admins</option>
        </select>
        <Button variant="secondary" onClick={load}>
          Filtrar
        </Button>
      </div>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      <ul className="space-y-2">
        {rows.map((u) => (
          <li
            key={u.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm"
          >
            <span>
              <strong>{u.name || u.username}</strong> · {u.email} ·{" "}
              <span className="text-stone-500">{u.role}</span>
            </span>
            <span className="flex flex-wrap gap-1">
              {(["student", "teacher", "admin"] as const).map((r) => (
                <Button
                  key={r}
                  variant={u.role === r ? "primary" : "ghost"}
                  onClick={() =>
                    void setAdminUserRole(u.id, r)
                      .then(() => {
                        toast(`Papel atualizado para ${r}.`);
                        load();
                      })
                      .catch(() => toast("Falha ao alterar papel."))
                  }
                >
                  {r}
                </Button>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
