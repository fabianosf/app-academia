import { useState } from "react";
import { Link } from "react-router-dom";
import { user } from "@/data/mock";
import { Button, Input } from "@/components/ui/primitives";
import { PageHeader, SafetyNotice } from "@/components/ShellBits";
import { useApp } from "@/hooks/AppContext";

export function ProfilePage() {
  const { profile, setProfile, toast } = useApp();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Perfil" subtitle="Seus dados orientam os treinos. Você pode ajustar quando quiser." />
      <div className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-stone-900 text-lg text-white">{user.avatarInitials}</div>
        <div>
          <p className="font-display text-xl font-semibold">{name}</p>
          <p className="text-sm text-stone-500">{user.email}</p>
          <p className="text-sm">Plano {user.plan}</p>
        </div>
      </div>
      <div className="grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 text-sm sm:grid-cols-2">
        <p><span className="text-stone-500">Objetivo</span><br />{profile.goal}</p>
        <p><span className="text-stone-500">Nível</span><br />{profile.level}</p>
        <p><span className="text-stone-500">Local</span><br />{profile.place}</p>
        <p><span className="text-stone-500">Frequência</span><br />{profile.weeklyFrequency} dias</p>
        <p className="sm:col-span-2"><span className="text-stone-500">Equipamentos</span><br />{profile.equipment.join(", ")}</p>
      </div>
      {editing && <Input aria-label="Nome" value={name} onChange={(e) => setName(e.target.value)} />}
      <div className="space-y-2 rounded-2xl border border-stone-200 bg-white p-4 text-sm">
        <label className="flex justify-between">Lembretes de treino <input type="checkbox" checked={profile.notifications.reminders} onChange={(e) => setProfile({ ...profile, notifications: { ...profile.notifications, reminders: e.target.checked } })} /></label>
        <label className="flex justify-between">Aulas ao vivo <input type="checkbox" checked={profile.notifications.live} onChange={(e) => setProfile({ ...profile, notifications: { ...profile.notifications, live: e.target.checked } })} /></label>
        <label className="flex justify-between">Mensagens da Nina <input type="checkbox" checked={profile.notifications.nina} onChange={(e) => setProfile({ ...profile, notifications: { ...profile.notifications, nina: e.target.checked } })} /></label>
        <label className="flex justify-between">Permitir prévia de câmera nesta sessão <input type="checkbox" checked={profile.cameraConsent} onChange={(e) => setProfile({ ...profile, cameraConsent: e.target.checked })} /></label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { setEditing((v) => !v); if (editing) toast("Perfil atualizado."); }}>{editing ? "Salvar perfil" : "Editar perfil"}</Button>
        <Button variant="secondary" onClick={() => toast("Assinatura Completa ativa até 05/11.")}>Gerenciar assinatura</Button>
        <Link to="/onboarding"><Button variant="ghost">Refazer onboarding</Button></Link>
        <Link to="/admin"><Button variant="ghost">Administração</Button></Link>
        <Link to="/analise-movimento"><Button variant="ghost">Análise de movimento</Button></Link>
      </div>
      <SafetyNotice>Termos: o app não armazena vídeo da câmera sem consentimento explícito. Interrompa o exercício se sentir dor, tontura ou mal-estar.</SafetyNotice>
    </div>
  );
}
