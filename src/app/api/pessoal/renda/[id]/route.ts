import { created } from "@/server/http/response";
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
      recebidaEm: data.recebidaEmDate
    });

    return created({ message: "Renda atualizada com sucesso." });
  }
});

export const DELETE = apiHandler({
  handler: async ({ user, params }) => {
    const incomeId = readStringParam(params.id, "id");
    await deleteIncome(user.id, incomeId);
    return created({ message: "Renda removida com sucesso." });
  }
});
