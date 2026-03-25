import { test, expect } from "@playwright/test";

test.describe("Seguranca da API", () => {
  test("logout same-origin responde sem expor detalhes internos", async ({ request }) => {
    const response = await request.post("/api/auth/logout", {
      headers: {
        Origin: "http://localhost:3000",
        Referer: "http://localhost:3000/login"
      }
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.message).toBeDefined();
    expect(body.issues).toBeUndefined();
  });

  test("mutações com origem externa nao expõem detalhes internos", async ({ request }) => {
    const response = await request.post("/api/auth/logout", {
      headers: {
        Origin: "https://evil.example",
        Referer: "https://evil.example/phish"
      }
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
