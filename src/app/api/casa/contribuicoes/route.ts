import { created, ok } from "@/server/http/response";
import { getHouseContributions, upsertContribution } from "@/server/services/house.service";
import { contributionSchema } from "@/server/validation/house";
import { apiHandler } from "@/server/http/handler";

export const GET = apiHandler({
  handler: async ({ user }) => {
    return ok(await getHouseContributions(user.id));
  }
});

export const POST = apiHandler({
  schema: contributionSchema,
  handler: async ({ user, data }) => {
    await upsertContribution(user.id, {
      valorCentavos: data.valorCentavos,
      mes: data.mes,
      ano: data.ano
    });

    return created({ message: "Contribuicao salva com sucesso." });
  }
});
