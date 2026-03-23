"use client";

const sections = [
  { id: "config-perfil", label: "Perfil" },
  { id: "config-geral", label: "Geral" },
  { id: "config-moradores", label: "Moradores" },
  { id: "config-convite", label: "Convite" },
  { id: "config-historico", label: "Historico" },
  { id: "config-saida", label: "Saida" }
] as const;

export function SettingsSectionNav() {
  return (
    <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className="border-4 border-neo-dark bg-white px-4 py-3 text-center font-heading text-xl uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 hover:bg-neo-cyan"
        >
          {section.label}
        </a>
      ))}
    </div>
  );
}
