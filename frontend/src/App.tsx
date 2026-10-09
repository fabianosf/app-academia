import { Suspense, lazy, type ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Toaster } from "sonner";
import { AppProvider, useApp } from "@/hooks/AppContext";
import { AppLayout } from "@/layouts/AppLayout";
import { homePathForUser, isPlatformAdmin, isTeacher } from "@/lib/roles";

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
const AdminUsersPage = lazy(() =>
  import("@/pages/admin/AdminUsersPage").then((m) => ({ default: m.AdminUsersPage })),
);
const AdminAssignmentsPage = lazy(() =>
  import("@/pages/admin/AdminAssignmentsPage").then((m) => ({
    default: m.AdminAssignmentsPage,
  })),
);
const TeacherDashboardPage = lazy(() =>
  import("@/pages/teacher/TeacherDashboardPage").then((m) => ({
    default: m.TeacherDashboardPage,
  })),
);
const TeacherStudentsPage = lazy(() =>
  import("@/pages/teacher/TeacherStudentsPage").then((m) => ({
    default: m.TeacherStudentsPage,
  })),
);
const TeacherStudentDetailPage = lazy(() =>
  import("@/pages/teacher/TeacherStudentDetailPage").then((m) => ({
    default: m.TeacherStudentDetailPage,
  })),
);
const TeacherContentPage = lazy(() =>
  import("@/pages/teacher/TeacherContentPage").then((m) => ({
    default: m.TeacherContentPage,
  })),
);
const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const ManagementLoginPage = lazy(() =>
  import("@/pages/admin/ManagementLoginPage").then((m) => ({
    default: m.ManagementLoginPage,
  })),
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
  const location = useLocation();

  if (authChecking) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-[#5e655f]">
        Conectando à Forma com Fabiano…
      </div>
    );
  }

  if (!authenticated) {
    const path = location.pathname;
    const managementPath =
      path.startsWith("/admin") || path.startsWith("/professor");
    return (
      <Navigate to={managementPath ? "/admin/login" : "/login"} replace />
    );
  }

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-[#5e655f]">
        Carregando seu plano…
      </div>
    );
  }

  return <Outlet />;
}

function RoleHome() {
  const { user } = useApp();
  if (isPlatformAdmin(user) || isTeacher(user)) {
    return <Navigate to={homePathForUser(user)} replace />;
  }
  return <DashboardPage />;
}

function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useApp();
  if (isPlatformAdmin(user)) return <>{children}</>;
  if (isTeacher(user)) return <Navigate to="/professor" replace />;
  return <Navigate to="/" replace />;
}

function RequireTeacher({ children }: { children: ReactNode }) {
  const { user } = useApp();
  if (isTeacher(user) || isPlatformAdmin(user)) return <>{children}</>;
  return <Navigate to="/" replace />;
}

function RequireStudentArea({ children }: { children: ReactNode }) {
  const { user } = useApp();
  // Professores/admins não usam a área do aluno por omissão
  if (isTeacher(user) || isPlatformAdmin(user)) {
    return <Navigate to={homePathForUser(user)} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin/login" element={<ManagementLoginPage />} />
            <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
            <Route element={<ProtectedApp />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<RoleHome />} />
                <Route
                  path="/onboarding"
                  element={
                    <RequireStudentArea>
                      <OnboardingPage />
                    </RequireStudentArea>
                  }
                />
                <Route
                  path="/treinos"
                  element={<WorkoutsPage />}
                />
                <Route path="/treinos/:id" element={<WorkoutDetailPage />} />
                <Route
                  path="/treino/:id/executar"
                  element={
                    <RequireStudentArea>
                      <ExecutePage />
                    </RequireStudentArea>
                  }
                />
                <Route
                  path="/ao-vivo"
                  element={
                    <RequireStudentArea>
                      <LiveHubPage />
                    </RequireStudentArea>
                  }
                />
                <Route
                  path="/ao-vivo/:id"
                  element={
                    <RequireStudentArea>
                      <LiveRoomPage />
                    </RequireStudentArea>
                  }
                />
                <Route
                  path="/progresso"
                  element={
                    <RequireStudentArea>
                      <ProgressPage />
                    </RequireStudentArea>
                  }
                />
                <Route
                  path="/nina"
                  element={
                    <RequireStudentArea>
                      <NinaPage />
                    </RequireStudentArea>
                  }
                />
                <Route
                  path="/analise-movimento"
                  element={
                    <RequireStudentArea>
                      <MovementPage />
                    </RequireStudentArea>
                  }
                />
                <Route path="/perfil" element={<ProfilePage />} />

                <Route
                  path="/professor"
                  element={
                    <RequireTeacher>
                      <TeacherDashboardPage />
                    </RequireTeacher>
                  }
                />
                <Route
                  path="/professor/alunos"
                  element={
                    <RequireTeacher>
                      <TeacherStudentsPage />
                    </RequireTeacher>
                  }
                />
                <Route
                  path="/professor/alunos/:id"
                  element={
                    <RequireTeacher>
                      <TeacherStudentDetailPage />
                    </RequireTeacher>
                  }
                />
                <Route
                  path="/professor/conteudos"
                  element={
                    <RequireTeacher>
                      <TeacherContentPage />
                    </RequireTeacher>
                  }
                />

                <Route
                  path="/admin"
                  element={
                    <RequireAdmin>
                      <AdminPage />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/utilizadores"
                  element={
                    <RequireAdmin>
                      <AdminUsersPage />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="/admin/atribuicoes"
                  element={
                    <RequireAdmin>
                      <AdminAssignmentsPage />
                    </RequireAdmin>
                  }
                />
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
