import { ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { readStringParam } from "@/server/http/params";
import { transferHouseAdmin } from "@/server/services/residents.service";
import { apiHandler } from "@/server/http/handler";

export const PATCH = apiHandler({
  handler: async ({ user, params }) => {
    const residentId = readStringParam(params.id, "id");
    await transferHouseAdmin(user.id, residentId);
    revalidateAppViews(["settings"]);
    return ok({ message: "Administracao transferida com sucesso." });
  }
});
