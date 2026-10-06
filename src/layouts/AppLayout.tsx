import { Outlet } from "react-router-dom";
import { AppSidebar, MobileBottomNav } from "@/components/AppNav";
import { AppHeader } from "@/components/ShellBits";

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-paper text-stone-900">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-10">
          <div className="page-content mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
