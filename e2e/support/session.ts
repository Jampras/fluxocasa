import { expect, type Page } from "@playwright/test";

export async function createE2ESession(page: Page) {
  const response = await page.request.post("/api/test/session");

  expect(response.ok()).toBeTruthy();
}

export async function createE2EOnboardingSession(page: Page) {
  const response = await page.request.post("/api/test/onboarding-session");

  expect(response.ok()).toBeTruthy();
}

export function todayInputValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60_000;

  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}
