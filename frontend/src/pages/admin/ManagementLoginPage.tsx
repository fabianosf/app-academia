import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Shield } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button, Input } from "@/components/ui/primitives";
import { useApp } from "@/hooks/AppContext";
import { homePathForUser, isManagementUser } from "@/lib/roles";
import { ApiError } from "@/services/http";

export function ManagementLoginPage() {
  const { authenticated, signIn, authChecking, user, signOut } = useApp();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (authChecking) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-[#5e655f]">
        Preparando sua sessão…
      </div>
    );
  }

  if (authenticated) {
    if (isManagementUser(user)) {
      return <Navigate to={homePathForUser(user)} replace />;
    }
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim() || !password) {
      setError("Preencha e-mail/usuário e senha.");
      return;
    }
    setLoading(true);
    try {
      const me = await signIn(identifier.trim(), password, "management");
      if (!isManagementUser(me)) {
        signOut();
        setError("Esta conta é de aluno. Use o acesso do aluno.");
        return;
      }
      navigate(homePathForUser(me), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const body = err.body as { detail?: string; code?: string } | null;
        if (err.status === 403 && body?.code === "portal_student_required") {
          setError(
            body.detail || "Esta conta é de aluno. Use o acesso do aluno.",
          );
        } else if (err.status === 401) {
          setError("Usuário ou senha incorretos.");
        } else {
          setError(
            typeof body?.detail === "string"
              ? body.detail
              : "Não foi possível entrar. Verifique a conexão com a API.",
          );
        }
      } else {
        setError("Não foi possível entrar. Verifique a conexão com a API.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Área de gestão"
      title="Entrada da equipa"
      subtitle="Professores e administradores entram por aqui. O papel real da conta define o que cada um pode ver e fazer."
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6d5d]">
        Área de gestão
      </p>
      <h2 className="mt-2 flex items-center gap-2 font-display text-3xl font-semibold tracking-tight text-[#1d2a26]">
        <Shield size={28} className="text-[#b07050]" aria-hidden />
        Entrar
      </h2>
      <p className="mt-2 text-sm text-[#5e655f]">
        Após o login, professores vão ao painel e administradores à gestão global.
        A escolha desta tela não altera permissões.
      </p>

      <form className="mt-7 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm">
          <span className="mb-1.5 flex items-center gap-2 font-medium text-[#31403a]">
            <Mail size={15} className="text-[#b07050]" /> E-mail ou usuário
          </span>
          <Input
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="gestao@email.com"
            required
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 flex items-center gap-2 font-medium text-[#31403a]">
            <Lock size={15} className="text-[#b07050]" /> Senha
          </span>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              required
              className="pr-11"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a847c]"
              onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <div className="flex justify-end">
          <Link
            to="/esqueci-senha"
            className="text-sm font-medium text-[#b1603d] transition-colors hover:text-[#8f4a30]"
          >
            Esqueci a senha
          </Link>
        </div>

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
            {error.includes("aluno") && (
              <>
                {" "}
                <Link to="/login" className="font-semibold underline underline-offset-2">
                  Ir para o acesso do aluno
                </Link>
              </>
            )}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando…" : "Entrar na área de gestão"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#5e655f]">
        É aluno?{" "}
        <Link to="/login" className="font-medium text-[#b1603d] hover:text-[#8f4a30]">
          Acesso do aluno
        </Link>
      </p>

      {import.meta.env.DEV && (
        <p className="mt-4 rounded-2xl border border-[#eadfdb] bg-[#faf7f4] px-3 py-3 text-xs leading-relaxed text-[#5e655f]">
          Local: <span className="font-semibold text-[#31403a]">admin</span> ou{" "}
          <span className="font-semibold text-[#31403a]">professor</span> /{" "}
          <span className="font-semibold text-[#31403a]">forma123</span>
        </p>
      )}
    </AuthLayout>
  );
}
