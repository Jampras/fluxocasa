import { z } from "zod";

import { ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { apiHandler } from "@/server/http/handler";
import { moveNote, moveNoteToTarget } from "@/server/services/notes.service";

const noteMoveSchema = z.union([
  z.object({
    noteId: z.string().min(1, "Informe a anotacao."),
    direction: z.enum(["up", "down"])
  }),
  z.object({
    noteId: z.string().min(1, "Informe a anotacao."),
    targetNoteId: z.string().min(1, "Informe o destino.")
  })
]);

export const PATCH = apiHandler({
  schema: noteMoveSchema,
  handler: async ({ user, data }) => {
    if ("targetNoteId" in data) {
      await moveNoteToTarget(user.id, data.noteId, data.targetNoteId);
    } else {
      await moveNote(user.id, data.noteId, data.direction);
    }

    revalidateAppViews(["anotacoes"]);

    return ok({ message: "Ordem atualizada." });
  }
});
