import { ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { readStringParam } from "@/server/http/params";
import { deleteIncome, markIncomeAsReceived, updateIncome } from "@/server/services/personal.service";
import { incomeSchema } from "@/server/validation/personal";
import { apiHandler } from "@/server/http/handler";

export const PATCH = apiHandler({
  handler: async ({ user, params }) => {
    const incomeId = readStringParam(params.id, "id");
    await markIncomeAsReceived(user.id, incomeId);
    revalidateAppViews(["personal"]);

    return ok({ message: "Renda marcada como recebida." });
  }
});

export const PUT = apiHandler({
  schema: incomeSchema,
  handler: async ({ user, data, params }) => {
    const incomeId = readStringParam(params.id, "id");
    await updateIncome(user.id, incomeId, {
      titulo: data.titulo,
      categoria: data.categoria,
      valorCentavos: data.valorCentavos,
      recebidaEm: data.recebidaEmDate,
      status: data.status,
      frequencia: data.frequencia,
      parcelasTotais: data.parcelasTotais
    });
    revalidateAppViews(["personal"]);

    return ok({ message: "Renda atualizada com sucesso." });
  }
});

export const DELETE = apiHandler({
  handler: async ({ user, params }) => {
    const incomeId = readStringParam(params.id, "id");
    await deleteIncome(user.id, incomeId);
    revalidateAppViews(["personal"]);
    return ok({ message: "Renda removida com sucesso." });
  }
});
