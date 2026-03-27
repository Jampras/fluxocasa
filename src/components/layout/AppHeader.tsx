import { LogoutButton } from "@/components/forms/LogoutButton";

interface AppHeaderProps {
  monthLabel: string;
  userName?: string;
  eyebrow?: string;
  title?: string;
}

export function AppHeader({ monthLabel, userName, eyebrow, title }: AppHeaderProps) {
  const isDashboard = !!userName;
  const eyebrowClass =
    "mb-1 font-heading text-[10px] uppercase tracking-[0.22em] text-neo-pink sm:text-sm sm:tracking-[0.26em] md:text-[0.95rem]";
  const titleClass =
    "font-heading uppercase leading-[0.92] text-neo-dark break-words [text-wrap:balance]";

  return (
    <header className="compact-desktop-section mb-5 flex flex-col gap-3 pt-1 sm:mb-6 xl:mb-8">
      <div className="flex items-start justify-between gap-3 border-b-[3px] border-neo-dark pb-3 sm:items-end sm:gap-4 sm:border-b-4 sm:pb-4">
        {isDashboard ? (
          <div className="flex flex-col overflow-visible pt-1">
            <h2 className={eyebrowClass}>
              {monthLabel}
            </h2>
            <h1 className={`${titleClass} text-[clamp(3rem,5.1vw,5.35rem)]`}>
              {userName}
            </h1>
          </div>
        ) : (
          <div className="flex flex-col overflow-visible pt-1">
            {eyebrow ? (
              <h2 className={eyebrowClass}>
                {eyebrow}
              </h2>
            ) : null}
            <h1 className={`${titleClass} text-[clamp(2.65rem,4.6vw,4.6rem)]`}>
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
