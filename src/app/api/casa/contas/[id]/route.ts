import { ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import {
  deleteHouseBill,
  markHouseBillAsPaid,
  updateHouseBill
} from "@/server/services/house.service";
import { readStringParam } from "@/server/http/params";
import { updateHouseBillSchema } from "@/server/validation/house";
import { apiHandler } from "@/server/http/handler";

export const PATCH = apiHandler({
  handler: async ({ user, params }) => {
    const billId = readStringParam(params.id, "id");
    await markHouseBillAsPaid(user.id, billId);
    revalidateAppViews(["house"]);
    return ok({ message: "Conta marcada como paga." });
  }
});

export const PUT = apiHandler({
  schema: updateHouseBillSchema,
  handler: async ({ user, data, params }) => {
    const billId = readStringParam(params.id, "id");
    await updateHouseBill(user.id, billId, {
      titulo: data.titulo,
      categoria: data.categoria,
      valorCentavos: data.valorCentavos,
      vencimento: data.vencimentoDate,
      observacao: data.observacao || undefined,
      status: data.status,
      frequencia: data.frequencia,
      parcelasTotais: data.parcelasTotais
    });
    revalidateAppViews(["house"]);

    return ok({ message: "Conta da casa atualizada com sucesso." });
  }
});

export const DELETE = apiHandler({
  handler: async ({ user, params }) => {
    const billId = readStringParam(params.id, "id");
    await deleteHouseBill(user.id, billId);
    revalidateAppViews(["house"]);
    return ok({ message: "Conta da casa removida com sucesso." });
  }
});
