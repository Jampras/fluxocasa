import { created } from "@/server/http/response";
import { readStringParam } from "@/server/http/params";
import {
  deletePersonalBill,
  markPersonalBillAsPaid,
  updatePersonalBill
} from "@/server/services/personal.service";
import { updatePersonalBillSchema } from "@/server/validation/personal";
import { apiHandler } from "@/server/http/handler";

export const PATCH = apiHandler({
  handler: async ({ user, params }) => {
    const billId = readStringParam(params.id, "id");
    await markPersonalBillAsPaid(user.id, billId);
    return created({ message: "Conta pessoal marcada como paga." });
  }
});

export const PUT = apiHandler({
  schema: updatePersonalBillSchema,
  handler: async ({ user, data, params }) => {
    const billId = readStringParam(params.id, "id");
    await updatePersonalBill(user.id, billId, {
      titulo: data.titulo,
      categoria: data.categoria,
      valorCentavos: data.valorCentavos,
      vencimento: data.vencimentoDate,
      observacao: data.observacao || undefined,
      status: data.status
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
