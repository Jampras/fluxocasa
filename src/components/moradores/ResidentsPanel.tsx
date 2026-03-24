import { ShieldCheck } from "lucide-react";

import { LeaveHouseActions } from "@/components/forms/LeaveHouseActions";
import { InviteCodeActions } from "@/components/forms/InviteCodeActions";
import { ResidentManagementActions } from "@/components/forms/ResidentManagementActions";
import { Card } from "@/components/ui/Card";
import type { ResidentsSnapshot } from "@/types";

interface ResidentsPanelProps {
  snapshot: ResidentsSnapshot;
}

export function ResidentsPanel({ snapshot }: ResidentsPanelProps) {
  const sortedResidents = [...snapshot.residents].sort((a, b) => (a.isCurrentUser === b.isCurrentUser ? 0 : a.isCurrentUser ? -1 : 1));

  return (
    <section className="grid gap-4 animate-fade-in-up pb-10 xl:gap-6">
      <div id="config-moradores" className="space-y-3">
        <p className="font-heading text-[10px] uppercase tracking-[0.18em] text-neo-pink sm:text-sm sm:tracking-[0.28em]">
          Moradores
        </p>
        <h2 className="font-heading text-3xl uppercase text-neo-dark sm:text-4xl">
          Gestao da casa
        </h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.78fr)] xl:items-start">
        <div className="grid gap-4 xl:gap-5">
          <div className="grid gap-3 xl:grid-cols-2">
            {sortedResidents.map((resident) => {
              const isMe = resident.isCurrentUser;
              return (
                <Card 
                  key={resident.id} 
                  className={isMe 
                    ? "bg-neo-bg border-4 border-neo-dark rounded-none p-4 flex flex-col transition-all xl:min-h-[190px]" 
                    : "bg-neo-bg border-4 border-neo-dark rounded-none p-4 flex flex-col hover:-translate-y-1 hover:shadow-[4px_4px_0_#0F172A] active:scale-95 transition-all text-neo-dark xl:min-h-[190px]"
                  }
                >
                  <div className="flex items-center gap-3 sm:gap-5">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-none border-[3px] border-neo-dark bg-neo-bg text-2xl font-bold sm:h-[4rem] sm:w-[4rem] sm:border-4 sm:text-3xl" style={{ color: "#fafaf9" }}>
                      {resident.avatar}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-lg font-bold tracking-tight text-neo-dark sm:text-xl">
                        {resident.name}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <div className="grid h-4 w-4 place-items-center rounded-full bg-green-500/20 text-green-600">
                          <ShieldCheck className="h-3 w-3" />
                        </div>
                        <span className={`text-xs font-semibold ${isMe ? "text-neo-dark/90" : "text-neo-pink"}`}>
                          {resident.role === "ADMIN" ? "Administrador" : "Morador"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {snapshot.canManageResidents && !isMe ? (
                    <div className="mt-4 border-t border-black/5 pt-4">
                      <ResidentManagementActions
                        residentId={resident.id}
                        residentName={resident.name}
                      />
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>

          <Card id="config-historico" className="rounded-none border-4 border-neo-dark bg-neo-bg p-4 sm:p-5 xl:p-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-neo-dark">Historico da casa</h3>
                <p className="text-sm text-neo-dark/60">Ultimos eventos da administracao e da entrada de moradores.</p>
              </div>
              {snapshot.auditLog.length === 0 ? (
                <p className="text-sm text-neo-dark/60">Nenhum evento registrado ainda.</p>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2">
                {snapshot.auditLog.map((item) => (
                  <div key={item.id} className="border-[3px] border-neo-dark bg-white px-4 py-3 shadow-[4px_4px_0_#0F172A] sm:border-4">
                    <div className="flex flex-col gap-2">
                      <div>
                        <p className="text-base font-bold text-neo-dark">{item.title}</p>
                        <p className="text-sm text-neo-dark/65">{item.description}</p>
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neo-pink">{item.createdAtLabel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid gap-4 xl:sticky xl:top-8">
          <div id="config-convite">
            <InviteCodeActions
              inviteCode={snapshot.inviteCode}
              canRotate={snapshot.canManageResidents}
            />
          </div>

          <div id="config-saida">
            <LeaveHouseActions
              isAdmin={snapshot.currentUserRole === "ADMIN"}
              residentCount={snapshot.residents.length}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
