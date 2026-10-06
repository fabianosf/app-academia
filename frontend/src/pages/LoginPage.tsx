import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button, Input } from "@/components/ui/primitives";
import { useApp } from "@/hooks/AppContext";
import { ApiError } from "@/services/http";

export function LoginPage() {
  const { authenticated, signIn, authChecking } = useApp();
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

  if (authenticated) return <Navigate to="/" replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(identifier.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Usuário ou senha incorretos.");
      } else {
        setError("Não foi possível entrar. Verifique a conexão com a API.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bem-vindo de volta"
      subtitle="Entre para continuar seus treinos, aulas e conversas com a Nina — no seu ritmo."
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6d5d]">
        Acessar conta
      </p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#1d2a26]">
        Entrar
      </h2>
      <p className="mt-2 text-sm text-[#5e655f]">
        Use seu e-mail ou usuário e a senha da conta.
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
            placeholder="fabiano@postay.com.br"
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
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Entrando…" : "Entrar"}
        </Button>
      </form>

      <p className="mt-6 rounded-2xl border border-[#eadfdb] bg-[#faf7f4] px-3 py-3 text-xs leading-relaxed text-[#5e655f]">
        Demo: <span className="font-semibold text-[#31403a]">fabiano</span> /{" "}
        <span className="font-semibold text-[#31403a]">forma123</span>
      </p>
    </AuthLayout>
  );
}
