import { expect, test } from "@playwright/test";

test.describe("Dashboard", () => {
  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 10_000 });

    await expect(page.locator("h1")).toContainText("FLUXO");
  });

  test("root route resolves to an auth surface when there is no local session", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/(login|dashboard|onboarding)/);
  });
});
