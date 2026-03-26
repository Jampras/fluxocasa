import { expect, test } from "@playwright/test";

import {
  createE2EOnboardingSession,
  createE2ESession,
  sameOriginApiHeaders,
  todayInputValue
} from "./support/session";

test.describe("Authenticated App", () => {
  test.setTimeout(60_000);

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
    await expect(page.getByText("Caixa da casa")).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Calendario interativo", { exact: true })).toBeVisible({ timeout: 30000 });
  });

  test("authenticated user can access the notes view", async ({ page }) => {
    await createE2ESession(page);
    await page.goto("/anotacoes", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Mural vivo")).toBeVisible();
    await expect(page.getByText("Nova anotacao")).toBeVisible();
  });

  test("authenticated user can create, edit and delete a note", async ({ page }) => {
    const noteTitle = `Nota E2E ${Date.now()}`;
    const updatedTitle = `${noteTitle} editada`;

    await createE2ESession(page);
    const createResponse = await page.request.post("/api/anotacoes", {
      headers: sameOriginApiHeaders(),
      data: {
        titulo: noteTitle,
        conteudo: "Primeira versao da anotacao.",
        tag: "Checklist",
        escopo: "PESSOAL",
        isPublica: true
      }
    });

    expect(createResponse.ok()).toBeTruthy();

    await page.goto("/anotacoes", { waitUntil: "domcontentloaded" });
    await expect(page.getByText(noteTitle)).toBeVisible({ timeout: 10000 });

    const noteCard = page.locator("article").filter({ hasText: noteTitle }).first();
    await expect(noteCard.getByText("Checklist")).toBeVisible();
    const boardResponse = await page.request.get("/api/anotacoes", {
      headers: sameOriginApiHeaders()
    });
    expect(boardResponse.ok()).toBeTruthy();
    const board = (await boardResponse.json()) as { notes: Array<{ id: string; title: string }> };
    const createdNote = board.notes.find((note) => note.title === noteTitle);

    expect(createdNote?.id).toBeTruthy();

    const updateResponse = await page.request.put(`/api/anotacoes/${createdNote!.id}`, {
      headers: sameOriginApiHeaders(),
      data: {
        titulo: updatedTitle,
        conteudo: "Texto atualizado da anotacao.",
        tag: "Checklist",
        escopo: "PESSOAL",
        isPublica: true
      }
    });

    expect(updateResponse.ok()).toBeTruthy();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(updatedTitle)).toBeVisible({ timeout: 10000 });
    const deleteResponse = await page.request.delete(`/api/anotacoes/${createdNote!.id}`, {
      headers: sameOriginApiHeaders(),
      data: {}
    });
    expect(deleteResponse.ok()).toBeTruthy();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.getByText(updatedTitle)).toHaveCount(0, { timeout: 10000 });
  });

  test("authenticated user can access settings", async ({ page }) => {
    await createE2ESession(page);
    await page.goto("/configuracoes", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("Configuracoes gerais")).toBeVisible();
  });

  test("authenticated user without house is redirected to onboarding", async ({ page }) => {
    await createE2EOnboardingSession(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.getByText("Primeiros passos", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Sua casa" })).toBeVisible();
  });

  test("onboarding redirects to dashboard after creating a house", async ({ page }) => {
    await createE2EOnboardingSession(page);
    await page.goto("/onboarding", { waitUntil: "domcontentloaded" });

    const createResponse = await page.request.post("/api/onboarding/create-house", {
      headers: sameOriginApiHeaders(),
      data: {
        nome: `Casa onboarding ${Date.now()}`
      }
    });

    expect(createResponse.ok()).toBeTruthy();

    await page.goto("/onboarding", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("personal income can move from previsto to recebido", async ({ page }) => {
    const incomeTitle = `Salario E2E ${Date.now()}`;

    await createE2ESession(page);
    const createResponse = await page.request.post("/api/pessoal/renda", {
      headers: sameOriginApiHeaders(),
      data: {
        titulo: incomeTitle,
        categoria: "SALARIO",
        valor: 1000,
        recebidaEm: todayInputValue(),
        status: "PREVISTO"
      }
    });

    expect(createResponse.ok()).toBeTruthy();

    await page.goto("/gerenciar?tab=pessoal", { waitUntil: "domcontentloaded" });
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
      headers: sameOriginApiHeaders(),
      data: {
        titulo: billTitle,
        categoria: "Moradia",
        valor: 500,
        vencimento: todayInputValue()
      }
    });

    expect(createResponse.ok()).toBeTruthy();

    await page.goto("/gerenciar?tab=casa", { waitUntil: "domcontentloaded" });
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
      headers: sameOriginApiHeaders(),
      data: {
        titulo: billTitle,
        categoria: "Moradia",
        valor: 450,
        vencimento: today
      }
    });

    const incomeResponse = await page.request.post("/api/pessoal/renda", {
      headers: sameOriginApiHeaders(),
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

    await page.goto("/dashboard", { waitUntil: "domcontentloaded", timeout: 45_000 });

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
