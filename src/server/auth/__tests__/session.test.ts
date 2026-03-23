// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
import { createSessionToken, verifySessionToken } from "@/server/auth/session";

vi.mock("@/config/env", () => ({
  getServerEnv: () => ({ APP_SECRET: "test-secret-at-least-32-chars-long!!" }),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

describe("session token", () => {
  it("createSessionToken returns a valid JWT string", async () => {
    const token = await createSessionToken({ userId: "user-123" });
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("verifySessionToken validates a correct token", async () => {
    const token = await createSessionToken({ userId: "user-456" });
    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload!.userId).toBe("user-456");
  });

  it("verifySessionToken rejects a tampered token", async () => {
    const token = await createSessionToken({ userId: "user-789" });
    const tampered = token.slice(0, -5) + "XXXXX";
    const payload = await verifySessionToken(tampered);
    expect(payload).toBeNull();
  });

  it("verifySessionToken rejects a garbage string", async () => {
    const payload = await verifySessionToken("not.a.jwt");
    expect(payload).toBeNull();
  });
});
