import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button, Input } from "@/components/ui/primitives";
import { useApp } from "@/hooks/AppContext";
import { homePathForUser } from "@/lib/roles";
import { requestPasswordReset } from "@/services/api";

export function ForgotPasswordPage() {
  const { authenticated, authChecking, user } = useApp();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);
  const [error, setError] = useState("");

  if (authChecking) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-[#5e655f]">
        Preparando sua sessão…
      </div>
    );
  }

  if (authenticated) return <Navigate to={homePathForUser(user)} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await requestPasswordReset(email.trim());
      setSent(true);
      setDevUrl(res.devResetUrl ?? null);
    } catch {
      setError("Não foi possível enviar o pedido. Tente de novo em instantes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Recupere o acesso"
      subtitle="Informe o e-mail da sua conta. Se ele existir conosco, você recebe o caminho para criar uma nova senha."
    >
      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#5e655f] transition-colors hover:text-[#1d2a26]"
      >
        <ArrowLeft size={16} /> Voltar ao login
      </Link>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6d5d]">
        Segurança da conta
      </p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#1d2a26]">
        Esqueci a senha
      </h2>

      {sent ? (
        <div className="mt-7 space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-4 text-sm text-emerald-900">
            Se existir uma conta com este e-mail, enviamos as instruções para redefinir a senha.
          </div>
          <p className="text-sm text-[#5e655f]">
            Confira também a pasta de spam. Em desenvolvimento, o link pode aparecer no console do
            servidor Django.
          </p>
          {devUrl && (
            <a
              href={devUrl}
              className="block break-all rounded-xl border border-[#eadfdb] bg-[#faf7f4] px-3 py-3 text-xs font-medium text-[#b1603d] hover:underline"
            >
              Link de desenvolvimento: redefinir senha
            </a>
          )}
          <Link to="/login">
            <Button className="w-full">Voltar para entrar</Button>
          </Link>
        </div>
      ) : (
        <form className="mt-7 space-y-4" onSubmit={onSubmit}>
          <p className="text-sm text-[#5e655f]">
            Digite o e-mail cadastrado. Vamos orientar os próximos passos com segurança.
          </p>
          <label className="block text-sm">
            <span className="mb-1.5 flex items-center gap-2 font-medium text-[#31403a]">
              <Mail size={15} className="text-[#b07050]" /> E-mail
            </span>
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
            />
          </label>
          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enviando…" : "Enviar instruções"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
