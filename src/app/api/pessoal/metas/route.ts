import { created, ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { budgetGoalSchema } from "@/server/validation/personal";
import { getPersonalGoals, upsertBudgetGoal } from "@/server/services/personal.service";
import { apiHandler } from "@/server/http/handler";

export const GET = apiHandler({
  handler: async ({ user }) => {
    return ok(await getPersonalGoals(user.id));
  }
});

export const POST = apiHandler({
  schema: budgetGoalSchema,
  handler: async ({ user, data }) => {
    await upsertBudgetGoal(user.id, {
      categoria: data.categoria,
      valorMetaCentavos: data.valorMetaCentavos,
      mes: data.mes,
      ano: data.ano
    });
    revalidateAppViews(["personal"]);

    return created({ message: "Meta salva com sucesso." });
  }
});
