import { created } from "@/server/http/response";
import { readStringParam } from "@/server/http/params";
import { removeHouseResident } from "@/server/services/residents.service";
import { apiHandler } from "@/server/http/handler";

export const DELETE = apiHandler({
  handler: async ({ user, params }) => {
    const residentId = readStringParam(params.id, "id");
    await removeHouseResident(user.id, residentId);
    return created({ message: "Morador removido com sucesso." });
  }
});
