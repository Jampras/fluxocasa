import { created, ok } from "@/server/http/response";
import { incomeSchema } from "@/server/validation/personal";
import { createIncome, getPersonalSnapshot } from "@/server/services/personal.service";
import { apiHandler } from "@/server/http/handler";

export const GET = apiHandler({
  handler: async ({ user }) => {
    const snapshot = await getPersonalSnapshot(user.id);

    return ok({
      totalMonthly: snapshot.totalMonthly,
      salary: snapshot.salary,
      freelance: snapshot.freelance
    });
  }
});

export const POST = apiHandler({
  schema: incomeSchema,
  handler: async ({ user, data }) => {
    await createIncome(user.id, {
      titulo: data.titulo,
      valorCentavos: data.valorCentavos,
      recebidaEm: data.recebidaEmDate
    });

    return created({ message: "Renda salva com sucesso." });
  }
});
