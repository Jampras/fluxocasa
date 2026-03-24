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
    <header className="mb-6 flex flex-col gap-3 pt-1 sm:mb-8">
      <div className="flex items-start justify-between gap-3 border-b-[3px] border-neo-dark pb-3 sm:items-end sm:gap-4 sm:border-b-4 sm:pb-4">
        {isDashboard ? (
          <div className="flex flex-col overflow-hidden">
            <h2 className="mb-1 font-heading text-sm uppercase tracking-[0.22em] text-neo-pink sm:text-lg sm:tracking-wider">
              {monthLabel}
            </h2>
            <h1 className="truncate font-heading text-4xl uppercase leading-none text-neo-dark sm:text-5xl md:text-7xl">
              {userName}
            </h1>
          </div>
        ) : (
          <div className="flex flex-col overflow-hidden">
            {eyebrow ? (
              <h2 className="mb-1 font-heading text-[11px] uppercase tracking-[0.22em] text-neo-pink sm:text-sm md:text-base md:tracking-wider">
                {eyebrow}
              </h2>
            ) : null}
            <h1 className="truncate font-heading text-3xl uppercase leading-none text-neo-dark sm:text-4xl md:text-6xl">
              {title}
            </h1>
          </div>
        )}
        <div className="shrink-0">
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
