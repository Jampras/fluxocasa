import { created } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { readStringParam } from "@/server/http/params";
import { deleteIncome, updateIncome } from "@/server/services/personal.service";
import { incomeSchema } from "@/server/validation/personal";
import { apiHandler } from "@/server/http/handler";

export const PUT = apiHandler({
  schema: incomeSchema,
  handler: async ({ user, data, params }) => {
    const incomeId = readStringParam(params.id, "id");
    await updateIncome(user.id, incomeId, {
      titulo: data.titulo,
      valorCentavos: data.valorCentavos,
      recebidaEm: data.recebidaEmDate,
      frequencia: data.frequencia,
      parcelasTotais: data.parcelasTotais
    });
    revalidateAppViews();

    return created({ message: "Renda atualizada com sucesso." });
  }
});

export const DELETE = apiHandler({
  handler: async ({ user, params }) => {
    const incomeId = readStringParam(params.id, "id");
    await deleteIncome(user.id, incomeId);
    revalidateAppViews();
    return created({ message: "Renda removida com sucesso." });
  }
});
