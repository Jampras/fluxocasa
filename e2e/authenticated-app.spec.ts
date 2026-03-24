import { expect, test } from "@playwright/test";

import { createE2ESession, todayInputValue } from "./support/session";

test.describe("Authenticated App", () => {
  test("authenticated user can access the general dashboard", async ({ page }) => {
    await createE2ESession(page);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Painel principal")).toBeVisible();
    await expect(page.getByText("Calendario interativo", { exact: true })).toBeVisible();
  });

  test("authenticated user can access the house management view", async ({ page }) => {
    await createE2ESession(page);
    await page.goto("/gerenciar?tab=casa", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Fluxo da casa", { exact: true })).toBeVisible();
  });

  test("authenticated user can access the personal management view", async ({ page }) => {
    await createE2ESession(page);
    await page.goto("/gerenciar?tab=pessoal", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Fluxo pessoal", { exact: true })).toBeVisible();
  });

  test("authenticated user is redirected from the old calendar route to the dashboard", async ({ page }) => {
    await createE2ESession(page);
    await page.goto("/calendario", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText("Calendario interativo", { exact: true })).toBeVisible();
  });

  test("authenticated user can access the goals view", async ({ page }) => {
    await createE2ESession(page);
    await page.goto("/metas", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Saldo pessoal")).toBeVisible();
  });

  test("authenticated user can access settings", async ({ page }) => {
    await createE2ESession(page);
    await page.goto("/configuracoes", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Configuracoes gerais")).toBeVisible();
  });

  test("personal income can move from previsto to recebido", async ({ page }) => {
    const incomeTitle = `Salario E2E ${Date.now()}`;

    await createE2ESession(page);
    const createResponse = await page.request.post("/api/pessoal/renda", {
      data: {
        titulo: incomeTitle,
        categoria: "SALARIO",
        valor: 1000,
        recebidaEm: todayInputValue(),
        status: "PREVISTO"
      }
    });

    expect(createResponse.ok()).toBeTruthy();

    await page.goto("/gerenciar?tab=pessoal");
    const incomeCard = page.locator("details").filter({ hasText: incomeTitle }).first();

    await expect(incomeCard).toBeVisible();
    await expect(incomeCard).toContainText("Previsto");

    await incomeCard.locator("summary").click();
    await incomeCard.getByRole("button", { name: /Marcar como recebido/i }).click();

    await expect(page.locator("details").filter({ hasText: incomeTitle }).first()).toContainText("Recebido", {
      timeout: 10000
    });
  });

  test("house bill can be marked as paid from the house panel", async ({ page }) => {
    const billTitle = `Aluguel E2E ${Date.now()}`;

    await createE2ESession(page);
    const createResponse = await page.request.post("/api/casa/contas", {
      data: {
        titulo: billTitle,
        categoria: "Moradia",
        valor: 500,
        vencimento: todayInputValue()
      }
    });

    expect(createResponse.ok()).toBeTruthy();

    await page.goto("/gerenciar?tab=casa");
    const billCard = page.locator("details").filter({ hasText: billTitle }).first();

    await expect(billCard).toBeVisible();
    await page.getByRole("button", { name: /Marcar como paga/i }).first().click();

    await expect(page.locator("details").filter({ hasText: billTitle }).first()).toContainText("Paga", {
      timeout: 10000
    });
  });

  test("calendar day modal allows viewing and adding records", async ({ page }) => {
    const billTitle = `Conta calendario ${Date.now()}`;
    const incomeTitle = `Receita calendario ${Date.now()}`;
    const newBillTitle = `Conta popup ${Date.now()}`;
    const today = todayInputValue();

    await createE2ESession(page);

    const houseBillResponse = await page.request.post("/api/casa/contas", {
      data: {
        titulo: billTitle,
        categoria: "Moradia",
        valor: 450,
        vencimento: today
      }
    });

    const incomeResponse = await page.request.post("/api/pessoal/renda", {
      data: {
        titulo: incomeTitle,
        categoria: "SALARIO",
        valor: 900,
        recebidaEm: today,
        status: "PREVISTO"
      }
    });

    expect(houseBillResponse.ok()).toBeTruthy();
    expect(incomeResponse.ok()).toBeTruthy();

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });

    await page.locator('button[aria-label*="2 registros"]').first().click();

    await expect(page.getByText("Agenda do dia")).toBeVisible();
    await expect(page.locator("div").filter({ hasText: billTitle }).first()).toBeVisible();
    await expect(page.locator("div").filter({ hasText: incomeTitle }).first()).toBeVisible();

    await page.getByRole("button", { name: /Conta pessoal/i }).click();
    await page.locator('form input[name="titulo"]').fill(newBillTitle);
    await page.locator('form input[name="categoria"]').fill("Teste");
    await page.locator('form input[name="valor"]').fill("123.45");
    await page.getByRole("button", { name: /Salvar neste dia/i }).click();

    await expect(page.locator("div").filter({ hasText: newBillTitle }).first()).toBeVisible({ timeout: 10000 });
  });
});
