import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import { AppSidebar, MobileBottomNav } from "@/components/AppNav";
import { AppHeader } from "@/components/ShellBits";

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-transparent text-foreground">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader />
        <main className="flex-1 px-4 pb-24 pt-5 md:px-8 md:pb-10">
          <div className="mx-auto max-w-7xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="page-content"
            >
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
