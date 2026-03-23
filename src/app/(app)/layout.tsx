import type { ReactNode } from "react";

import { Navbar } from "@/components/layout/Navbar";
import { FabWizard } from "@/components/ui/FabWizard";
import { requireCurrentResident } from "@/server/auth/user";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireCurrentResident();

  return (
    <div className="flex min-h-screen flex-col md:flex-row relative overflow-x-hidden w-full bg-neo-bg">
      <div className="absolute inset-0 pointer-events-none opacity-5 z-0" style={{ backgroundImage: "radial-gradient(circle, #0F172A 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }} />
      <Navbar />
      <main className="flex-1 px-4 md:px-12 pb-32 pt-10 md:pt-14 lg:px-20 max-w-[100vw] md:max-w-6xl mx-auto w-full relative z-10">
        {children}
        <FabWizard />
      </main>
    </div>
  );
}
