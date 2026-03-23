import { created } from "@/server/http/response";
import { readStringParam } from "@/server/http/params";
import { deletePersonalBill, updatePersonalBill } from "@/server/services/personal.service";
import { personalBillSchema } from "@/server/validation/personal";
import { apiHandler } from "@/server/http/handler";

export const PUT = apiHandler({
  schema: personalBillSchema,
  handler: async ({ user, data, params }) => {
    const billId = readStringParam(params.id, "id");
    await updatePersonalBill(user.id, billId, {
      titulo: data.titulo,
      categoria: data.categoria,
      valorCentavos: data.valorCentavos,
      vencimento: data.vencimentoDate,
      observacao: data.observacao || undefined
    });

    return created({ message: "Conta pessoal atualizada com sucesso." });
  }
});

export const DELETE = apiHandler({
  handler: async ({ user, params }) => {
    const billId = readStringParam(params.id, "id");
    await deletePersonalBill(user.id, billId);
    return created({ message: "Conta pessoal removida com sucesso." });
  }
});
