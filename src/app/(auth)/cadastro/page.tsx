import Link from "next/link";

import { ROUTES } from "@/config/routes";
import { Card } from "@/components/ui/Card";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { redirectIfAuthenticated } from "@/server/auth/user";

export default async function CadastroPage() {
  await redirectIfAuthenticated();

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-10">
      <Card className="w-full bg-dopamine-bg border border-dopamine-pink/20 shadow-none">
        <div className="space-y-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-dopamine-dark/60">Novo morador</p>
            <h1 className="font-serif text-5xl font-semibold text-dopamine-dark">Continuar</h1>
            <p className="text-sm text-dopamine-dark/70">Entre com Google e depois siga para a configuracao da casa.</p>
          </div>
          <RegisterForm />
          <p className="text-sm text-dopamine-dark/70">
            Ja possui acesso?{" "}
            <Link className="font-semibold text-dopamine-dark" href={ROUTES.login}>
              Voltar para entrada
            </Link>
          </p>
        </div>
      </Card>
    </main>
  );
}
