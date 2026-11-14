import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, UserRound } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button, Input } from "@/components/ui/primitives";
import { useApp } from "@/hooks/AppContext";
import { homePathForUser } from "@/lib/roles";

export function SignupPage() {
  const { authenticated, authChecking, signUp, user } = useApp();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    return <Navigate to={homePathForUser(user)} replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Preencha nome, e-mail e senha para continuar.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem. Verifique e tente novamente.");
      return;
    }

    setLoading(true);
    try {
      await signUp(name, email, password);
      navigate("/onboarding", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível criar sua conta.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Crie sua conta"
      subtitle="Comece sua rotina com clareza, acompanhamento inteligente e foco no que realmente importa."
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6d5d]">
        Acesso do aluno
      </p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#1d2a26]">
        Criar conta
      </h2>
      <p className="mt-2 text-sm text-[#5e655f]">
        Cadastre-se para receber um onboarding inicial e entrar no seu espaço de treino.
      </p>

      <form className="mt-7 space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm">
          <span className="mb-1.5 flex items-center gap-2 font-medium text-[#31403a]">
            <UserRound size={15} className="text-[#b07050]" /> Nome completo
          </span>
          <Input
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome"
            required
          />
        </label>

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

        <label className="block text-sm">
          <span className="mb-1.5 flex items-center gap-2 font-medium text-[#31403a]">
            <Lock size={15} className="text-[#b07050]" /> Senha
          </span>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              className="pr-11"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a847c]"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <label className="block text-sm">
          <span className="mb-1.5 flex items-center gap-2 font-medium text-[#31403a]">
            <Lock size={15} className="text-[#b07050]" /> Confirmar senha
          </span>
          <Input
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repita sua senha"
            required
          />
        </label>

        {error && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando conta…" : "Criar conta"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-[#5e655f]">
        Já tem conta?{" "}
        <Link to="/login" className="font-medium text-[#b1603d] hover:text-[#8f4a30]">
          Entrar
        </Link>
      </p>
    </AuthLayout>
  );
}
