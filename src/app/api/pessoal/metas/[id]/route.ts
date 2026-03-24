import { ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { readStringParam } from "@/server/http/params";
import { deleteBudgetGoal, updateBudgetGoal } from "@/server/services/personal.service";
import { updateBudgetGoalSchema } from "@/server/validation/personal";
import { apiHandler } from "@/server/http/handler";

export const PUT = apiHandler({
  schema: updateBudgetGoalSchema,
  handler: async ({ user, data, params }) => {
    const goalId = readStringParam(params.id, "id");
    await updateBudgetGoal(user.id, goalId, {
      categoria: data.categoria,
      valorMetaCentavos: data.valorMetaCentavos
    });
    revalidateAppViews(["personal"]);

    return ok({ message: "Meta atualizada com sucesso." });
  }
});

export const DELETE = apiHandler({
  handler: async ({ user, params }) => {
    const goalId = readStringParam(params.id, "id");
    await deleteBudgetGoal(user.id, goalId);
    revalidateAppViews(["personal"]);
    return ok({ message: "Meta removida com sucesso." });
  }
});
