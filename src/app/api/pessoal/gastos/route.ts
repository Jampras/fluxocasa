import { created, ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { expenseSchema } from "@/server/validation/personal";
import { createExpense, getPersonalGoals } from "@/server/services/personal.service";
import { apiHandler } from "@/server/http/handler";

export const GET = apiHandler({
  handler: async ({ user }) => {
    return ok(
      (await getPersonalGoals(user.id)).map((goal) => ({
        categoria: goal.label,
        gastoAtual: goal.spent,
        limite: goal.limit
      }))
    );
  }
});

export const POST = apiHandler({
  schema: expenseSchema,
  handler: async ({ user, data }) => {
    await createExpense(user.id, {
      titulo: data.titulo,
      categoria: data.categoria,
      valorCentavos: data.valorCentavos,
      gastoEm: data.gastoEmDate
    });
    revalidateAppViews();

    return created({ message: "Gasto salvo com sucesso." });
  }
});
