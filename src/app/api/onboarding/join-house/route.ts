import { created } from "@/server/http/response";
import { joinHouseByInviteCode } from "@/server/services/house.service";
import { joinHouseSchema } from "@/server/validation/house";
import { apiHandler } from "@/server/http/handler";

export const POST = apiHandler({
  schema: joinHouseSchema,
  handler: async ({ user, data }) => {
    const result = await joinHouseByInviteCode(user.id, data.codigoConvite);
    return created({ message: "Entrada na casa concluida.", casaId: result.casaId });
  }
});
