import { expect, test } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("login page loads correctly", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("h1")).toContainText("FLUXO");
    await expect(page.locator("text=Acesso restrito")).toBeVisible();
  });

  test("at least one authentication method is visible", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator('input[name="email"]');
    const googleButton = page.getByRole("button", { name: /google/i });

    const hasForm = await emailInput.isVisible().catch(() => false);
    const hasGoogle = await googleButton.isVisible().catch(() => false);

    expect(hasForm || hasGoogle).toBe(true);
  });

  test("registration page loads", async ({ page }) => {
    await page.goto("/cadastro");
    await expect(page.locator("h1")).toBeVisible();
  });
});
