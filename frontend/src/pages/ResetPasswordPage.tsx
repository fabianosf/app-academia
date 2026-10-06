import { FormEvent, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Button, Input } from "@/components/ui/primitives";
import { useApp } from "@/hooks/AppContext";
import { confirmPasswordReset } from "@/services/api";
import { ApiError } from "@/services/http";

export function ResetPasswordPage() {
  const { authenticated, authChecking } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";
  const validLink = Boolean(uid && token);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const mismatch = useMemo(
    () => confirm.length > 0 && password !== confirm,
    [password, confirm],
  );

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
    if (mismatch) return;
    setError("");
    setLoading(true);
    try {
      await confirmPasswordReset({ uid, token, password });
      navigate("/login", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        const detail =
          typeof err.body === "object" && err.body && "detail" in err.body
            ? String((err.body as { detail: string }).detail)
            : "Não foi possível redefinir a senha.";
        setError(detail);
      } else {
        setError("Não foi possível redefinir a senha.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Nova senha"
      subtitle="Escolha uma senha segura para voltar aos seus treinos com tranquilidade."
    >
      <Link
        to="/login"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#5e655f] transition-colors hover:text-[#1d2a26]"
      >
        <ArrowLeft size={16} /> Voltar ao login
      </Link>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6d5d]">
        Redefinição
      </p>
      <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-[#1d2a26]">
        Criar nova senha
      </h2>

      {!validLink ? (
        <div className="mt-7 space-y-4">
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Este link é inválido ou incompleto. Solicite um novo em “Esqueci a senha”.
          </p>
          <Link to="/esqueci-senha">
            <Button className="w-full">Pedir novo link</Button>
          </Link>
        </div>
      ) : (
        <form className="mt-7 space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="mb-1.5 flex items-center gap-2 font-medium text-[#31403a]">
              <Lock size={15} className="text-[#b07050]" /> Nova senha
            </span>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
              placeholder="Mínimo 6 caracteres"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 flex items-center gap-2 font-medium text-[#31403a]">
              <Lock size={15} className="text-[#b07050]" /> Confirmar senha
            </span>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={6}
              required
              placeholder="Repita a senha"
            />
          </label>
          {mismatch && (
            <p className="text-sm text-rose-700">As senhas não coincidem.</p>
          )}
          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading || mismatch}>
            {loading ? "Salvando…" : "Salvar nova senha"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
