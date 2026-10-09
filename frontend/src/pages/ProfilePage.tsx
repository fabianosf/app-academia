import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Input } from "@/components/ui/primitives";
import { PageHeader, SafetyNotice } from "@/components/ShellBits";
import { useApp } from "@/hooks/AppContext";
import {
  fetchTeacherSharing,
  updateTeacherSharing,
  type TeacherSharing,
} from "@/services/api";

export function ProfilePage() {
  const { profile, setProfile, toast, user, updateUserName, signOut } = useApp();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [sharing, setSharing] = useState<TeacherSharing | null>(null);
  const isStudent = !user.role || user.role === "student";
  const isAdmin = user.role === "admin" || user.isPlatformAdmin;
  const isTeacher = user.role === "teacher" || user.isTeacher;

  useEffect(() => {
    if (!isStudent) return;
    void fetchTeacherSharing()
      .then(setSharing)
      .catch(() => setSharing(null));
  }, [isStudent]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        title="Perfil"
        subtitle="Seus dados orientam os treinos. Você pode ajustar quando quiser."
      />
      <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-stone-900 text-lg text-white">
          {user.avatarInitials}
        </div>
        <div>
          <p className="font-display text-xl font-semibold">{name}</p>
          <p className="text-sm text-stone-500">{user.email}</p>
          <p className="text-sm">
            Plano {user.plan}
            {user.role ? ` · ${user.role}` : ""}
          </p>
        </div>
      </div>
      {isStudent && (
        <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm sm:grid-cols-2">
          <p>
            <span className="text-stone-500">Objetivo</span>
            <br />
            {profile.goal}
          </p>
          <p>
            <span className="text-stone-500">Nível</span>
            <br />
            {profile.level}
          </p>
          <p>
            <span className="text-stone-500">Local</span>
            <br />
            {profile.place}
          </p>
          <p>
            <span className="text-stone-500">Frequência</span>
            <br />
            {profile.weeklyFrequency} dias
          </p>
          <p className="sm:col-span-2">
            <span className="text-stone-500">Equipamentos</span>
            <br />
            {profile.equipment.join(", ")}
          </p>
        </div>
      )}
      {isStudent && sharing && (
        <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm">
          <h2 className="font-display text-lg font-semibold">Partilha com o professor</h2>
          {sharing.teacher ? (
            <p>
              Professor atual: <strong>{sharing.teacher.name}</strong> ({sharing.teacher.email})
            </p>
          ) : (
            <p className="text-stone-600">{sharing.message || "Sem professor atribuído."}</p>
          )}
          {sharing.teacher && (
            <ul className="space-y-2">
              {sharing.categories.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-2"
                >
                  <span>
                    <strong>{c.label}</strong>
                    <br />
                    <span className="text-xs text-stone-500">{c.description}</span>
                  </span>
                  <Button
                    variant={c.active ? "secondary" : "primary"}
                    onClick={() =>
                      void updateTeacherSharing(c.id, c.active ? "revoke" : "grant")
                        .then(setSharing)
                        .catch(() => toast("Não foi possível atualizar o consentimento."))
                    }
                  >
                    {c.active ? "Revogar" : "Autorizar"}
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {sharing.correctionRequestHint && (
            <p className="text-xs text-stone-500">{sharing.correctionRequestHint}</p>
          )}
        </div>
      )}
      {editing && (
        <Input aria-label="Nome" value={name} onChange={(e) => setName(e.target.value)} />
      )}
      {isStudent && (
        <div className="space-y-2 rounded-2xl border border-stone-200 bg-white p-4 text-sm">
          <label className="flex justify-between">
            Lembretes de treino{" "}
            <input
              type="checkbox"
              checked={profile.notifications.reminders}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  notifications: { ...profile.notifications, reminders: e.target.checked },
                })
              }
            />
          </label>
          <label className="flex justify-between">
            Aulas ao vivo{" "}
            <input
              type="checkbox"
              checked={profile.notifications.live}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  notifications: { ...profile.notifications, live: e.target.checked },
                })
              }
            />
          </label>
          <label className="flex justify-between">
            Mensagens da Nina{" "}
            <input
              type="checkbox"
              checked={profile.notifications.nina}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  notifications: { ...profile.notifications, nina: e.target.checked },
                })
              }
            />
          </label>
          <label className="flex justify-between">
            Permitir prévia de câmera nesta sessão{" "}
            <input
              type="checkbox"
              checked={profile.cameraConsent}
              onChange={(e) => setProfile({ ...profile, cameraConsent: e.target.checked })}
            />
          </label>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={async () => {
            if (editing) {
              try {
                await updateUserName(name);
              } catch {
                toast("Não foi possível salvar o nome.");
                return;
              }
            }
            setEditing((v) => !v);
          }}
        >
          {editing ? "Salvar perfil" : "Editar perfil"}
        </Button>
        {isStudent && (
          <>
            <Link to="/onboarding">
              <Button variant="ghost">Refazer onboarding</Button>
            </Link>
            <Link to="/analise-movimento">
              <Button variant="ghost">Análise de movimento</Button>
            </Link>
          </>
        )}
        {isAdmin && (
          <Link to="/admin">
            <Button variant="ghost">Administração</Button>
          </Link>
        )}
        {isTeacher && (
          <Link to="/professor">
            <Button variant="ghost">Área do professor</Button>
          </Link>
        )}
        <Button
          variant="secondary"
          onClick={() => {
            signOut();
            navigate("/login", { replace: true });
          }}
        >
          Sair
        </Button>
      </div>
      <SafetyNotice>
        Termos: o app não armazena vídeo da câmera sem consentimento explícito. Interrompa o
        exercício se sentir dor, tontura ou mal-estar.
      </SafetyNotice>
    </div>
  );
}
