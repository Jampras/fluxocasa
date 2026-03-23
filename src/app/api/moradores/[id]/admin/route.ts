import { ok } from "@/server/http/response";
import { readStringParam } from "@/server/http/params";
import { transferHouseAdmin } from "@/server/services/residents.service";
import { apiHandler } from "@/server/http/handler";

export const PATCH = apiHandler({
  handler: async ({ user, params }) => {
    const residentId = readStringParam(params.id, "id");
    await transferHouseAdmin(user.id, residentId);
    return ok({ message: "Administracao transferida com sucesso." });
  }
});
