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
    <div className="space-y-8 pb-20">
      <AppHeader monthLabel={snapshot.monthLabel} title="Configuracoes" />

      <SettingsSectionNav />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card id="config-perfil" className="bg-white p-6">
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">
            Perfil
          </p>
          <h2 className="mt-3 font-heading text-4xl uppercase text-neo-dark">{user.nome}</h2>
          <div className="mt-6 grid gap-4">
            <div className="border-4 border-neo-dark bg-neo-bg px-4 py-3">
              <p className="font-body text-xs font-black uppercase tracking-[0.18em] text-neo-dark/60">
                E-mail
              </p>
              <p className="mt-1 font-body text-base font-bold text-neo-dark">
                {user.email || "Nao informado"}
              </p>
            </div>
            <div className="border-4 border-neo-dark bg-neo-bg px-4 py-3">
              <p className="font-body text-xs font-black uppercase tracking-[0.18em] text-neo-dark/60">
                Papel atual
              </p>
              <p className="mt-1 font-body text-base font-bold text-neo-dark">
                {snapshot.currentUserRole === "ADMIN" ? "Administrador" : "Morador"}
              </p>
            </div>
            <div className="border-4 border-neo-dark bg-neo-bg px-4 py-3">
              <p className="font-body text-xs font-black uppercase tracking-[0.18em] text-neo-dark/60">
                Ambiente
              </p>
              <p className="mt-1 font-body text-base font-bold text-neo-dark">{snapshot.houseName}</p>
            </div>
          </div>
        </Card>

        <Card id="config-geral" className="bg-white p-6">
          <p className="font-heading text-sm uppercase tracking-[0.28em] text-neo-pink">
            Configuracoes gerais
          </p>
          <h2 className="mt-3 font-heading text-4xl uppercase text-neo-dark">
            Gerencie sua casa e seus acessos
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="border-4 border-neo-dark bg-neo-yellow px-4 py-3">
              <p className="font-body text-xs font-black uppercase tracking-[0.18em] text-neo-dark/60">
                Convite ativo
              </p>
              <p className="mt-1 font-heading text-3xl uppercase text-neo-dark">{snapshot.inviteCode}</p>
            </div>
            <div className="border-4 border-neo-dark bg-neo-cyan px-4 py-3">
              <p className="font-body text-xs font-black uppercase tracking-[0.18em] text-neo-dark/60">
                Moradores
              </p>
              <p className="mt-1 font-heading text-3xl uppercase text-neo-dark">
                {snapshot.residents.length}
              </p>
            </div>
            <div className="border-4 border-neo-dark bg-neo-lime px-4 py-3">
              <p className="font-body text-xs font-black uppercase tracking-[0.18em] text-neo-dark/60">
                Gestao
              </p>
              <p className="mt-1 font-body text-base font-bold text-neo-dark">
                Convites, moradores, historico e saida em uma so tela.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <a
              href="#config-convite"
              className="border-4 border-neo-dark bg-white px-4 py-3 font-heading text-xl uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 hover:bg-neo-yellow"
            >
              Ir para convite
            </a>
            <a
              href="#config-moradores"
              className="border-4 border-neo-dark bg-white px-4 py-3 font-heading text-xl uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 hover:bg-neo-cyan"
            >
              Ver moradores
            </a>
            <a
              href="#config-historico"
              className="border-4 border-neo-dark bg-white px-4 py-3 font-heading text-xl uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 hover:bg-neo-lime"
            >
              Abrir historico
            </a>
            <a
              href="#config-saida"
              className="border-4 border-neo-dark bg-white px-4 py-3 font-heading text-xl uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 hover:bg-neo-pink"
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
