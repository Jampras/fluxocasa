import { expect, test } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("login page loads correctly", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("h1")).toContainText("FLUXO");
    await expect(page.locator("text=Acesso restrito")).toBeVisible();
  });

  test("google is the only authentication method visible", async ({ page }) => {
    await page.goto("/login");

    const emailInput = page.locator('input[name="email"]');
    const googleButton = page.getByRole("button", { name: /google/i });

    await expect(googleButton).toBeVisible();
    expect(await emailInput.isVisible().catch(() => false)).toBe(false);
  });

  test("registration route redirects to login", async ({ page }) => {
    await page.goto("/cadastro");
    await expect(page).toHaveURL(/\/login/);
  });
});
