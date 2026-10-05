import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppProvider } from "@/hooks/AppContext";
import { AppLayout } from "@/layouts/AppLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { WorkoutsPage } from "@/pages/WorkoutsPage";
import { WorkoutDetailPage } from "@/pages/WorkoutDetailPage";
import { ExecutePage } from "@/pages/ExecutePage";
import { LiveHubPage } from "@/pages/LiveHubPage";
import { LiveRoomPage } from "@/pages/LiveRoomPage";
import { ProgressPage } from "@/pages/ProgressPage";
import { NinaPage } from "@/pages/NinaPage";
import { MovementPage } from "@/pages/MovementPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { AdminPage } from "@/pages/AdminPage";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
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
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
