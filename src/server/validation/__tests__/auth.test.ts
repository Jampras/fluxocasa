import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/server/validation/auth";

describe("loginSchema", () => {
  it("accepts valid login data", () => {
    const result = loginSchema.safeParse({ email: "user@test.com", senha: "12345678" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", senha: "123456" });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({ email: "user@test.com", senha: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    expect(loginSchema.safeParse({}).success).toBe(false);
    expect(loginSchema.safeParse({ email: "a@b.com" }).success).toBe(false);
    expect(loginSchema.safeParse({ senha: "12345678" }).success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      nome: "João",
      email: "joao@test.com",
      senha: "senha12345",
    });
    expect(result.success).toBe(true);
  });

  it("rejects name too short", () => {
    const result = registerSchema.safeParse({
      nome: "J",
      email: "j@t.com",
      senha: "senha12345",
    });
    expect(result.success).toBe(false);
  });
});
