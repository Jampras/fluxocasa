import { ok } from "@/server/http/response";
import { apiHandler } from "@/server/http/handler";

export const GET = apiHandler({
  auth: false,
  handler: async () => {
    return ok({
      status: "ok",
      timestamp: new Date().toISOString()
    });
  }
});
