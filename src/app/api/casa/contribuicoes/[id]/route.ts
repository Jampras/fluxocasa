import { created } from "@/server/http/response";
import { readStringParam } from "@/server/http/params";
import { deleteContribution } from "@/server/services/house.service";
import { apiHandler } from "@/server/http/handler";

export const DELETE = apiHandler({
  handler: async ({ user, params }) => {
    const contributionId = readStringParam(params.id, "id");
    await deleteContribution(user.id, contributionId);
    return created({ message: "Contribuicao removida com sucesso." });
  }
});
