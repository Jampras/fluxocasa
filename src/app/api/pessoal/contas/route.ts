import { created, ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { personalBillSchema } from "@/server/validation/personal";
import { createPersonalBill, getPersonalSnapshot } from "@/server/services/personal.service";
import { apiHandler } from "@/server/http/handler";

export const GET = apiHandler({
  handler: async ({ user }) => {
    return ok((await getPersonalSnapshot(user.id)).weeklyBills);
  }
});

export const POST = apiHandler({
  schema: personalBillSchema,
  handler: async ({ user, data }) => {
    await createPersonalBill(user.id, {
      titulo: data.titulo,
      categoria: data.categoria,
      valorCentavos: data.valorCentavos,
      vencimento: data.vencimentoDate,
      observacao: data.observacao || undefined,
      frequencia: data.frequencia,
      parcelasTotais: data.parcelasTotais
    });
    revalidateAppViews(["personal"]);

    return created({ message: "Conta pessoal salva com sucesso." });
  }
});
