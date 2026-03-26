import { z } from "zod";

import { ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { apiHandler } from "@/server/http/handler";
import { moveNote } from "@/server/services/notes.service";

const noteMoveSchema = z.object({
  noteId: z.string().min(1, "Informe a anotacao."),
  direction: z.enum(["up", "down"])
});

export const PATCH = apiHandler({
  schema: noteMoveSchema,
  handler: async ({ user, data }) => {
    await moveNote(user.id, data.noteId, data.direction);
    revalidateAppViews(["anotacoes"]);

    return ok({ message: "Ordem atualizada." });
  }
});
