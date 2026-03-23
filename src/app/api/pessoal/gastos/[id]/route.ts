import { ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { readStringParam } from "@/server/http/params";
import { deleteExpense, updateExpense } from "@/server/services/personal.service";
import { expenseSchema } from "@/server/validation/personal";
import { apiHandler } from "@/server/http/handler";

export const PUT = apiHandler({
  schema: expenseSchema,
  handler: async ({ user, data, params }) => {
    const expenseId = readStringParam(params.id, "id");
    await updateExpense(user.id, expenseId, {
      titulo: data.titulo,
      categoria: data.categoria,
      valorCentavos: data.valorCentavos,
      gastoEm: data.gastoEmDate
    });
    revalidateAppViews();

    return ok({ message: "Gasto atualizado com sucesso." });
  }
});

export const DELETE = apiHandler({
  handler: async ({ user, params }) => {
    const expenseId = readStringParam(params.id, "id");
    await deleteExpense(user.id, expenseId);
    revalidateAppViews();
    return ok({ message: "Gasto removido com sucesso." });
  }
});
