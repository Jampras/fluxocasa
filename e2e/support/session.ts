import { expect, type Page } from "@playwright/test";
import { hashPassword } from "@/server/auth/password";
import { SESSION_COOKIE, createSessionToken } from "@/server/auth/session";
import { authRepository } from "@/server/repositories/auth.repository";
import { createHouseForUser } from "@/server/services/house.service";

const E2E_BASE_URL = "http://localhost:3000";

async function attachSessionCookie(page: Page, userId: string) {
  const token = await createSessionToken({ userId });
  await page.context().addCookies([
    {
      name: SESSION_COOKIE,
      value: token,
      url: E2E_BASE_URL,
      httpOnly: true,
      sameSite: "Lax",
      secure: false
    }
  ]);
}

async function createE2EUser(namePrefix: string, withHouse: boolean) {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const user = await authRepository.createUser({
    nome: `${namePrefix} ${suffix}`,
    email: `${namePrefix.toLowerCase().replace(/\s+/g, "-")}+${suffix}@fluxocasa.test`,
    senhaHash: await hashPassword("Fluxo123!")
  });

  if (withHouse) {
    await createHouseForUser(user.id, `Casa E2E ${suffix}`);
  }

  return user;
}

export async function createE2ESession(page: Page) {
  const user = await createE2EUser("Teste E2E", true);
  await attachSessionCookie(page, user.id);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/dashboard|\/onboarding/);
}

export async function createE2EOnboardingSession(page: Page) {
  const user = await createE2EUser("Onboarding E2E", false);
  await attachSessionCookie(page, user.id);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/onboarding/);
}

export function todayInputValue() {
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60_000;

  return new Date(today.getTime() - offset).toISOString().slice(0, 10);
}

export function sameOriginApiHeaders() {
  return {
    Origin: "http://localhost:3000",
    Referer: "http://localhost:3000/dashboard"
  };
}
