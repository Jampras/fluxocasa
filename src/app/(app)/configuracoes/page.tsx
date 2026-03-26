import { ResidentsPanel } from "@/components/moradores/ResidentsPanel";
import { SettingsSectionNav } from "@/components/config/SettingsSectionNav";
import { AppHeader } from "@/components/layout/AppHeader";
import { Card } from "@/components/ui/Card";
import { requireCurrentResident } from "@/server/auth/user";
import { getResidentsSnapshot } from "@/server/services/residents.service";

export default async function ConfiguracoesPage() {
  const user = await requireCurrentResident();
  const snapshot = await getResidentsSnapshot(user.id);

  return (
    <div className="space-y-6 pb-16 sm:space-y-8 sm:pb-20 xl:space-y-10">
      <AppHeader monthLabel={snapshot.monthLabel} title="Configuracoes" />

      <SettingsSectionNav />

      <div className="grid gap-4 xl:grid-cols-[0.78fr_1.22fr] xl:gap-6">
        <Card id="config-perfil" className="bg-neo-cream p-4 sm:p-5 md:p-6 xl:p-7">
          <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.28em]">
            Perfil
          </p>
          <h2 className="mt-2 font-heading text-3xl uppercase text-neo-dark sm:mt-3 sm:text-4xl">{user.nome}</h2>
          <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4 xl:mt-8">
            <div className="border-[3px] border-neo-dark bg-neo-bg px-4 py-3 sm:border-4">
              <p className="font-body text-[10px] font-black uppercase tracking-[0.14em] text-neo-dark/60 sm:text-xs sm:tracking-[0.18em]">
                E-mail
              </p>
              <p className="mt-1 font-body text-base font-bold text-neo-dark">
                {user.email || "Nao informado"}
              </p>
            </div>
            <div className="border-[3px] border-neo-dark bg-neo-bg px-4 py-3 sm:border-4">
              <p className="font-body text-[10px] font-black uppercase tracking-[0.14em] text-neo-dark/60 sm:text-xs sm:tracking-[0.18em]">
                Papel atual
              </p>
              <p className="mt-1 font-body text-base font-bold text-neo-dark">
                {snapshot.currentUserRole === "ADMIN" ? "Administrador" : "Morador"}
              </p>
            </div>
            <div className="border-[3px] border-neo-dark bg-neo-bg px-4 py-3 sm:border-4">
              <p className="font-body text-[10px] font-black uppercase tracking-[0.14em] text-neo-dark/60 sm:text-xs sm:tracking-[0.18em]">
                Ambiente
              </p>
              <p className="mt-1 font-body text-base font-bold text-neo-dark">{snapshot.houseName}</p>
            </div>
          </div>
        </Card>

        <Card id="config-geral" className="bg-neo-cream p-4 sm:p-5 md:p-6 xl:p-7">
          <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.28em]">
            Configuracoes gerais
          </p>
          <h2 className="mt-2 font-heading text-3xl uppercase text-neo-dark sm:mt-3 sm:text-4xl">
            Gerencie sua casa e seus acessos
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3 sm:mt-6 sm:gap-4 xl:mt-8">
            <div className="border-[3px] border-neo-dark bg-neo-yellow px-4 py-3 sm:border-4">
              <p className="font-body text-[10px] font-black uppercase tracking-[0.14em] text-neo-dark/60 sm:text-xs sm:tracking-[0.18em]">
                Convite ativo
              </p>
              <p className="mt-1 font-heading text-2xl uppercase text-neo-dark sm:text-3xl">{snapshot.inviteCode}</p>
            </div>
            <div className="border-[3px] border-neo-dark bg-neo-cyan px-4 py-3 sm:border-4">
              <p className="font-body text-[10px] font-black uppercase tracking-[0.14em] text-neo-dark/60 sm:text-xs sm:tracking-[0.18em]">
                Moradores
              </p>
              <p className="mt-1 font-heading text-2xl uppercase text-neo-dark sm:text-3xl">
                {snapshot.residents.length}
              </p>
            </div>
            <div className="border-[3px] border-neo-dark bg-neo-lime px-4 py-3 sm:border-4">
              <p className="font-body text-[10px] font-black uppercase tracking-[0.14em] text-neo-dark/60 sm:text-xs sm:tracking-[0.18em]">
                Gestao
              </p>
              <p className="mt-1 font-body text-sm font-bold text-neo-dark sm:text-base">
                Convites, moradores, historico e saida em uma so tela.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:mt-6 sm:gap-3 md:grid-cols-2 xl:mt-8 xl:grid-cols-4">
            <a
              href="#config-convite"
                className="border-[3px] border-neo-dark bg-neo-cream px-4 py-3 font-heading text-base uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 hover:bg-neo-yellow sm:border-4 sm:text-xl"
            >
              Ir para convite
            </a>
            <a
              href="#config-moradores"
                className="border-[3px] border-neo-dark bg-neo-cream px-4 py-3 font-heading text-base uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 hover:bg-neo-cyan sm:border-4 sm:text-xl"
            >
              Ver moradores
            </a>
            <a
              href="#config-historico"
                className="border-[3px] border-neo-dark bg-neo-cream px-4 py-3 font-heading text-base uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 hover:bg-neo-lime sm:border-4 sm:text-xl"
            >
              Abrir historico
            </a>
            <a
              href="#config-saida"
                className="border-[3px] border-neo-dark bg-neo-cream px-4 py-3 font-heading text-base uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 hover:bg-neo-pink sm:border-4 sm:text-xl"
            >
              Sair da casa
            </a>
          </div>
        </Card>
      </div>

      <ResidentsPanel snapshot={snapshot} />
    </div>
  );
}
