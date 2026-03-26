import type { ReactNode } from "react";

import { Navbar } from "@/components/layout/Navbar";
import { FabWizard } from "@/components/ui/FabWizard";
import { requireCurrentResident } from "@/server/auth/user";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await requireCurrentResident();

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden md:flex-row">
      <Navbar />
      <main className="relative z-10 mx-auto w-full max-w-[100vw] flex-1 bg-transparent px-3 pb-28 pt-6 sm:px-4 sm:pt-8 md:mx-0 md:max-w-none md:px-6 md:pb-24 md:pt-8 lg:px-8 lg:pt-10 xl:px-12 xl:pt-12 2xl:mx-auto 2xl:max-w-[1500px] 2xl:px-14">
        {children}
        <FabWizard />
      </main>
    </div>
  );
}
