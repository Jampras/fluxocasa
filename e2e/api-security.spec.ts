import { test, expect } from "@playwright/test";

test.describe("Seguranca da API", () => {
  test("rotas de autenticacao retornam headers de rate limit", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      data: { email: "teste@teste.com", senha: "senha-invalida" }
    });

    expect(response.headers()["x-ratelimit-limit"]).toBeDefined();
    expect(response.headers()["x-ratelimit-remaining"]).toBeDefined();
  });

  test("login invalido nao expoe detalhes internos de validacao", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      data: { email: "email-invalido", senha: "" }
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.message).toBeDefined();
    expect(body.issues).toBeUndefined();
  });

  test("cookie forjado nao retorna acesso valido", async ({ request }) => {
    const response = await request.get("/api/pessoal/renda", {
      headers: {
        Cookie: "fluxocasa_session=eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJmYWtlLXVzZXItaWQifQ.INVALID_SIG"
      }
    });

    expect([401, 403, 302, 307, 400, 500]).toContain(response.status());
  });

  test("health endpoint responde com sucesso", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.ok()).toBe(true);
  });
});
