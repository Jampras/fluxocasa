import { Card } from "@/components/ui/Card";
import { OnboardingForms } from "@/components/forms/OnboardingForms";
import { ROUTES } from "@/config/routes";
import { requireCurrentUser } from "@/server/auth/user";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await requireCurrentUser();

  if (user.casaId) {
    redirect(ROUTES.dashboard);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-10">
      <Card className="w-full bg-dopamine-bg">
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-dopamine-dark/60">Primeiros passos</p>
            <h1 className="font-serif text-5xl font-semibold text-dopamine-dark">Sua casa</h1>
            <p className="text-sm text-dopamine-dark/70">
              Crie uma casa nova ou entre em uma existente com codigo de convite.
            </p>
          </div>
          <OnboardingForms />
        </div>
      </Card>
    </main>
  );
}
