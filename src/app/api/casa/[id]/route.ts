import { accepted, ok } from "@/server/http/response";
import { readStringParam } from "@/server/http/params";
import { getHouseSnapshot } from "@/server/services/house.service";
import { apiHandler } from "@/server/http/handler";

export const GET = apiHandler({
  handler: async ({ user, params }) => {
    const houseId = readStringParam(params.id, "id");
    return ok({
      id: houseId,
      ...(await getHouseSnapshot(user.id))
    });
  }
});

export const PUT = apiHandler({
  handler: async ({ params }) => {
    const houseId = readStringParam(params.id, "id");
    return accepted(`Atualizacao da casa ${houseId} pendente de persistencia real.`);
  }
});
