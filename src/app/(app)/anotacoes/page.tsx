import { AppHeader } from "@/components/layout/AppHeader";
import { NotesBoard } from "@/components/anotacoes/NotesBoard";
import { requireCurrentResident } from "@/server/auth/user";
import { getNotesBoardSnapshot } from "@/server/services/notes.service";

export default async function AnotacoesPage() {
  const user = await requireCurrentResident();
  const snapshot = await getNotesBoardSnapshot(user.id);

  return (
    <div className="space-y-6 pb-16 sm:space-y-8 sm:pb-20">
      <AppHeader monthLabel={snapshot.monthLabel} title="Anotacoes" eyebrow={snapshot.houseName} />
      <NotesBoard initialSnapshot={snapshot} />
    </div>
  );
}
