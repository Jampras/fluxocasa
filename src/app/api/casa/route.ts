import { ok } from "@/server/http/response";
import { revalidateAppViews } from "@/server/cache/revalidate-app";
import { getHouseSnapshot, leaveCurrentHouse } from "@/server/services/house.service";
import { apiHandler } from "@/server/http/handler";

export const GET = apiHandler({
  handler: async ({ user }) => {
    return ok(await getHouseSnapshot(user.id));
  }
});

export const DELETE = apiHandler({
  handler: async ({ user }) => {
    const result = await leaveCurrentHouse(user.id);
    revalidateAppViews();

    return ok({
      message:
        result.action === "HOUSE_DISSOLVED"
          ? "Casa encerrada com sucesso."
          : "Voce saiu da casa com sucesso."
    });
  }
});
