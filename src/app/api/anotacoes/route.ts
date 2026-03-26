import { created, ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { apiHandler } from "@/server/http/handler";
import { getNotesBoardSnapshot, createNote } from "@/server/services/notes.service";
import { noteSchema } from "@/server/validation/notes";

export const GET = apiHandler({
  handler: async ({ user }) => {
    return ok(await getNotesBoardSnapshot(user.id));
  }
});

export const POST = apiHandler({
  schema: noteSchema,
  handler: async ({ user, data }) => {
    await createNote(user.id, data);
    revalidateAppViews(["anotacoes"]);

    return created({ message: "Anotacao criada com sucesso." });
  }
});
