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
    <main className="relative mx-auto flex min-h-screen max-w-lg items-center justify-center overflow-hidden bg-neo-bg p-6">
      <div
        className="absolute inset-0 pointer-events-none z-0 opacity-5"
        style={{
          backgroundImage: "radial-gradient(circle, #0F172A 1.5px, transparent 1.5px)",
          backgroundSize: "24px 24px"
        }}
      />

      <NeoCard className="relative z-10 w-full bg-neo-cyan p-8 md:p-12">
        <div className="space-y-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <h1 className="font-heading text-6xl uppercase leading-[0.8] text-neo-dark drop-shadow-[2px_2px_0_#FFF]">
              FLUXO<span className="text-neo-pink">.</span>CASA
            </h1>
            <p className="border-4 border-neo-dark bg-white px-4 py-2 font-body text-xl font-bold uppercase tracking-wider text-neo-dark shadow-[4px_4px_0_#0F172A]">
              Acesso restrito
            </p>
          </div>

          {error ? (
            <div className="border-4 border-neo-dark bg-neo-pink p-4 text-center font-body font-bold text-white">
              {error}
            </div>
          ) : null}

          <LoginForm />
        </div>
      </NeoCard>
    </main>
  );
}
