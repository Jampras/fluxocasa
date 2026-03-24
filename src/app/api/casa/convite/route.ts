import { ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { rotateInviteCode } from "@/server/services/house.service";
import { apiHandler } from "@/server/http/handler";

export const PATCH = apiHandler({
  handler: async ({ user }) => {
    const result = await rotateInviteCode(user.id);
    revalidateAppViews(["settings"]);
    return ok({
      message: "Codigo de convite atualizado com sucesso.",
      inviteCode: result.codigoConvite
    });
  }
});
