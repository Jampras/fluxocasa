import { LogoutButton } from "@/components/forms/LogoutButton";

interface AppHeaderProps {
  monthLabel: string;
  userName?: string;
  eyebrow?: string;
  title?: string;
}

export function AppHeader({ monthLabel, userName, eyebrow, title }: AppHeaderProps) {
  const isDashboard = !!userName;

  return (
    <header className="flex flex-col gap-4 mb-8 pt-2">
      <div className="flex items-end justify-between border-b-4 border-neo-dark pb-4 gap-4">
        {isDashboard ? (
          <div className="flex flex-col overflow-hidden">
            <h2 className="font-heading text-xl text-neo-pink tracking-wider uppercase mb-1">{monthLabel}</h2>
            <h1 className="font-heading text-5xl md:text-7xl text-neo-dark uppercase leading-none truncate">{userName}</h1>
          </div>
        ) : (
          <div className="flex flex-col overflow-hidden">
            {eyebrow && <h2 className="font-heading text-sm md:text-base text-neo-pink tracking-wider uppercase mb-1">{eyebrow}</h2>}
            <h1 className="font-heading text-4xl md:text-6xl text-neo-dark uppercase leading-none truncate">{title}</h1>
          </div>
        )}
        <div className="shrink-0">
           <LogoutButton />
        </div>
      </div>
    </header>
  );
}
