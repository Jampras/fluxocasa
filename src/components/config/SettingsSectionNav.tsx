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
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 xl:grid-cols-6">
      {sections.map((section, index) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          className={`border-[3px] border-neo-dark px-3 py-3 text-center font-heading text-lg uppercase text-neo-dark shadow-[4px_4px_0_#0F172A] transition-all hover:-translate-y-1 sm:border-4 sm:px-4 sm:text-xl ${
            index % 3 === 0
              ? "bg-white hover:bg-neo-yellow"
              : index % 3 === 1
                ? "bg-white hover:bg-neo-cyan"
                : "bg-white hover:bg-neo-lime"
          }`}
        >
          {section.label}
        </a>
      ))}
    </div>
  );
}
