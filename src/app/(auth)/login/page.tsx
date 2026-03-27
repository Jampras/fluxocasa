import { LoginForm } from "@/components/forms/LoginForm";
import { NeoCard } from "@/components/ui/NeoCard";
import { redirectIfAuthenticated } from "@/server/auth/user";

const errorMessages: Record<string, string> = {
  oauth_callback: "O retorno do provedor nao trouxe o codigo esperado.",
  supabase_env: "Supabase nao configurado neste ambiente.",
  oauth_exchange: "Nao foi possivel concluir o login com Google.",
  oauth_user: "Nao foi possivel identificar o usuario autenticado.",
  oauth_unverified: "A conta Google precisa trazer um e-mail verificado para concluir a entrada."
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await redirectIfAuthenticated();
  const params = await searchParams;
  const error = params.error ? errorMessages[params.error] : null;

  return (
    <main className="relative mx-auto flex min-h-screen max-w-xl items-center justify-center overflow-hidden px-5 py-10 sm:px-6">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, rgba(15,23,42,0.28) 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }} />
        <div className="absolute -left-20 top-8 h-56 w-56 rounded-full bg-neo-yellow/20 blur-3xl" />
        <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-neo-cyan/20 blur-3xl" />
        <div className="absolute bottom-8 left-10 h-72 w-72 rounded-full bg-neo-pink/20 blur-3xl" />
      </div>

      <NeoCard className="relative z-10 w-full bg-neo-cream p-7 md:p-10">
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-3 text-center">
            <span className="border-[3px] border-neo-dark bg-neo-yellow px-3 py-1 font-heading text-xs uppercase tracking-[0.22em] text-neo-dark shadow-[4px_4px_0_#0F172A] sm:border-4 sm:text-sm">
              Acesso com Google
            </span>
            <h1 className="font-heading text-[clamp(3.2rem,9vw,5.5rem)] uppercase leading-[0.82] text-neo-dark drop-shadow-[2px_2px_0_#FFF7E6]">
              FLUXO<span className="text-neo-pink">.</span>CASA
            </h1>
            <p className="max-w-md font-body text-base font-bold uppercase tracking-[0.12em] text-neo-dark/75 sm:text-lg">
              Entre e siga direto para sua casa ou onboarding.
            </p>
          </div>

          {error ? (
            <div className="border-4 border-neo-dark bg-neo-pink p-4 text-center font-body font-bold text-neo-dark">
              {error}
            </div>
          ) : null}

          <LoginForm />
        </div>
      </NeoCard>
    </main>
  );
}
