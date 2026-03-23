import { created } from "@/server/http/response";
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

    return created({ message: "Meta atualizada com sucesso." });
  }
});

export const DELETE = apiHandler({
  handler: async ({ user, params }) => {
    const goalId = readStringParam(params.id, "id");
    await deleteBudgetGoal(user.id, goalId);
    return created({ message: "Meta removida com sucesso." });
  }
});
