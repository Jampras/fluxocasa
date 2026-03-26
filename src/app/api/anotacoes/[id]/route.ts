import { ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { apiHandler } from "@/server/http/handler";
import { readStringParam } from "@/server/http/params";
import { updateNoteSchema } from "@/server/validation/notes";
import { deleteNote, updateNote } from "@/server/services/notes.service";

export const PUT = apiHandler({
  schema: updateNoteSchema,
  handler: async ({ user, data, params }) => {
    await updateNote(user.id, readStringParam(params.id, "id"), data);
    revalidateAppViews(["anotacoes"]);

    return ok({ message: "Anotacao atualizada com sucesso." });
  }
});

export const DELETE = apiHandler({
  handler: async ({ user, params }) => {
    await deleteNote(user.id, readStringParam(params.id, "id"));
    revalidateAppViews(["anotacoes"]);

    return ok({ message: "Anotacao removida com sucesso." });
  }
});
