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
  return (
    <section className="grid gap-4 animate-fade-in-up pb-10">

        <div id="config-moradores" />
        {[...snapshot.residents].sort((a, b) => (a.isCurrentUser === b.isCurrentUser ? 0 : a.isCurrentUser ? -1 : 1)).map((resident) => {
          const isMe = resident.isCurrentUser;
          return (
            <Card 
              key={resident.id} 
              className={isMe 
                ? "bg-neo-bg border-4 border-neo-dark  rounded-none p-4 flex flex-col transition-all" 
                : "bg-neo-bg border-4 border-neo-dark  rounded-none p-4 flex flex-col hover:-translate-y-1 hover:shadow-[4px_4px_0_#0F172A] active:scale-95 transition-all transition-all text-neo-dark"
              }
            >
              <div className="flex items-center gap-5">
                <div className="grid h-[4rem] w-[4rem] shrink-0 place-items-center rounded-none border-4 border-neo-dark bg-neo-bg text-3xl font-bold" style={{ color: "#fafaf9" }}>
                  {resident.avatar}
                </div>
                <div className="flex-1 space-y-1">
                  <p className={`text-xl font-bold tracking-tight  ${isMe ? "text-neo-dark" : "text-neo-dark"}`}>
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
                <div className="mt-4 pt-4 border-t border-black/5">
                  <ResidentManagementActions
                    residentId={resident.id}
                    residentName={resident.name}
                  />
                </div>
              ) : null}
            </Card>
          );
        })}

        <div id="config-convite" className="mt-4">
          <InviteCodeActions
            inviteCode={snapshot.inviteCode}
            canRotate={snapshot.canManageResidents}
          />
        </div>

        <Card id="config-historico" className="bg-neo-bg border-4 border-neo-dark  rounded-none p-5">
          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-neo-dark">Historico da casa</h3>
              <p className="text-sm text-neo-dark/60">Ultimos eventos da administracao e da entrada de moradores.</p>
            </div>
            {snapshot.auditLog.length === 0 ? (
              <p className="text-sm text-neo-dark/60">Nenhum evento registrado ainda.</p>
            ) : null}
            <div className="grid gap-3">
              {snapshot.auditLog.map((item) => (
                <div key={item.id} className="rounded-[1.5rem] border border-neo-pink/15 bg-white px-4 py-3">
                  <div className="flex items-start justify-between gap-4">
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

        <div id="config-saida">
          <LeaveHouseActions
            isAdmin={snapshot.currentUserRole === "ADMIN"}
            residentCount={snapshot.residents.length}
          />
        </div>

    </section>
  );
}
