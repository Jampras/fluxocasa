import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { created } from "@/server/http/response";
import { createHouseForUser } from "@/server/services/house.service";
import { createHouseSchema } from "@/server/validation/house";
import { apiHandler } from "@/server/http/handler";

export const POST = apiHandler({
  schema: createHouseSchema,
  handler: async ({ user, data }) => {
    const result = await createHouseForUser(user.id, data.nome);
    revalidateAppViews(["membership"]);
    return created({ message: "Casa criada com sucesso.", casaId: result.casaId });
  }
});
