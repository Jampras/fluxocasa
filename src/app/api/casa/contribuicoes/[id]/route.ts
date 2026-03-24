import { ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { readStringParam } from "@/server/http/params";
import { deleteContribution } from "@/server/services/house.service";
import { apiHandler } from "@/server/http/handler";

export const DELETE = apiHandler({
  handler: async ({ user, params }) => {
    const contributionId = readStringParam(params.id, "id");
    await deleteContribution(user.id, contributionId);
    revalidateAppViews(["house"]);
    return ok({ message: "Contribuicao removida com sucesso." });
  }
});
