import type { ReactNode } from "react";

import { Navbar } from "@/components/layout/Navbar";
import { FabWizard } from "@/components/ui/FabWizard";
import { requireCurrentResident } from "@/server/auth/user";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireCurrentResident();

  return (
    <div className="flex min-h-screen flex-col md:flex-row relative overflow-x-hidden w-full bg-neo-bg">
      <Navbar />
      <main className="relative z-10 mx-auto w-full max-w-[100vw] flex-1 px-3 pb-28 pt-6 sm:px-4 sm:pt-8 md:max-w-6xl md:px-12 md:pb-32 md:pt-14 lg:px-20">
        {children}
        <FabWizard />
      </main>
    </div>
  );
}
