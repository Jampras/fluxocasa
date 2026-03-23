import { created, ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { houseBillSchema } from "@/server/validation/house";
import { createHouseBill, getHouseBills } from "@/server/services/house.service";
import { apiHandler } from "@/server/http/handler";

export const GET = apiHandler({
  handler: async ({ user }) => {
    return ok(await getHouseBills(user.id));
  }
});

export const POST = apiHandler({
  schema: houseBillSchema,
  handler: async ({ user, data }) => {
    await createHouseBill(user.id, {
      titulo: data.titulo,
      categoria: data.categoria,
      valorCentavos: data.valorCentavos,
      vencimento: data.vencimentoDate,
      observacao: data.observacao || undefined,
      frequencia: data.frequencia,
      parcelasTotais: data.parcelasTotais
    });
    revalidateAppViews();

    return created({ message: "Conta da casa criada com sucesso." });
  }
});
