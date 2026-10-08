import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider, useApp } from "@/hooks/AppContext";
import { AppLayout } from "@/layouts/AppLayout";

const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const OnboardingPage = lazy(() =>
  import("@/pages/OnboardingPage").then((m) => ({ default: m.OnboardingPage })),
);
const WorkoutsPage = lazy(() =>
  import("@/pages/WorkoutsPage").then((m) => ({ default: m.WorkoutsPage })),
);
const WorkoutDetailPage = lazy(() =>
  import("@/pages/WorkoutDetailPage").then((m) => ({ default: m.WorkoutDetailPage })),
);
const ExecutePage = lazy(() =>
  import("@/pages/ExecutePage").then((m) => ({ default: m.ExecutePage })),
);
const LiveHubPage = lazy(() =>
  import("@/pages/LiveHubPage").then((m) => ({ default: m.LiveHubPage })),
);
const LiveRoomPage = lazy(() =>
  import("@/pages/LiveRoomPage").then((m) => ({ default: m.LiveRoomPage })),
);
const ProgressPage = lazy(() =>
  import("@/pages/ProgressPage").then((m) => ({ default: m.ProgressPage })),
);
const NinaPage = lazy(() =>
  import("@/pages/NinaPage").then((m) => ({ default: m.NinaPage })),
);
const MovementPage = lazy(() =>
  import("@/pages/MovementPage").then((m) => ({ default: m.MovementPage })),
);
const ProfilePage = lazy(() =>
  import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const AdminPage = lazy(() =>
  import("@/pages/AdminPage").then((m) => ({ default: m.AdminPage })),
);
const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const ForgotPasswordPage = lazy(() =>
  import("@/pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("@/pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage })),
);

function PageFallback() {
  return (
    <div className="grid min-h-[40vh] place-items-center text-sm text-[#5e655f]">
      Carregando…
    </div>
  );
}

function ProtectedApp() {
  const { authChecking, authenticated, ready } = useApp();

  if (authChecking) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-[#5e655f]">
        Conectando à Forma com Fabiano…
      </div>
    );
  }

  if (!authenticated) return <Navigate to="/login" replace />;

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-[#5e655f]">
        Carregando seu plano…
      </div>
    );
  }

  return <Outlet />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
            <Route element={<ProtectedApp />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/treinos" element={<WorkoutsPage />} />
                <Route path="/treinos/:id" element={<WorkoutDetailPage />} />
                <Route path="/treino/:id/executar" element={<ExecutePage />} />
                <Route path="/ao-vivo" element={<LiveHubPage />} />
                <Route path="/ao-vivo/:id" element={<LiveRoomPage />} />
                <Route path="/progresso" element={<ProgressPage />} />
                <Route path="/nina" element={<NinaPage />} />
                <Route path="/analise-movimento" element={<MovementPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <Toaster richColors position="top-right" closeButton offset={20} />
    </AppProvider>
  );
}
