import { notFound } from "@/server/http/response";
import { apiHandler } from "@/server/http/handler";

export const GET = apiHandler({
  handler: async () => {
    return notFound("Use /api/casa para acessar a casa atual.");
  }
});

export const PUT = apiHandler({
  handler: async () => {
    return notFound("Rota legada removida.");
  }
});
