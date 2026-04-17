import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getUserByEmail: vi.fn(),
    createPasswordResetToken: vi.fn(),
    getPasswordResetToken: vi.fn(),
    markPasswordResetTokenUsed: vi.fn(),
    updateUserPassword: vi.fn(),
  };
});

// ─── Mock email helper ────────────────────────────────────────────────────────
vi.mock("./email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  buildPasswordResetEmail: vi.fn().mockReturnValue({
    subject: "Reset your Future AI password",
    html: "<p>Reset link</p>",
    text: "Reset link",
  }),
}));

import {
  getUserByEmail,
  createPasswordResetToken,
  getPasswordResetToken,
  markPasswordResetTokenUsed,
  updateUserPassword,
} from "./db";

// ─── Context factory ──────────────────────────────────────────────────────────
function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { cookie: vi.fn(), clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("auth.forgotPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success even when email is not found (prevents enumeration)", async () => {
    vi.mocked(getUserByEmail).mockResolvedValue(null);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.forgotPassword({
      email: "nobody@example.com",
      origin: "https://futureai.app",
    });

    expect(result).toEqual({ success: true });
    expect(createPasswordResetToken).not.toHaveBeenCalled();
  });

  it("creates a reset token and sends email when user exists", async () => {
    const mockUser = {
      id: 42,
      openId: "email_abc123",
      email: "user@example.com",
      name: "Test User",
      passwordHash: "$2b$12$hashed",
      role: "user" as const,
      creditBalance: 100,
      apiQuota: 100,
      avatar: null,
      loginMethod: "email",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    vi.mocked(getUserByEmail).mockResolvedValue(mockUser);
    vi.mocked(createPasswordResetToken).mockResolvedValue(undefined);

    const { sendEmail } = await import("./email");

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.forgotPassword({
      email: "user@example.com",
      origin: "https://futureai.app",
    });

    expect(result).toEqual({ success: true });
    expect(createPasswordResetToken).toHaveBeenCalledOnce();
    expect(sendEmail).toHaveBeenCalledOnce();

    // Verify the reset URL contains the origin
    const sendEmailCall = vi.mocked(sendEmail).mock.calls[0];
    expect(sendEmailCall?.[0]?.to).toBe("user@example.com");
  });
});

describe("auth.resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws BAD_REQUEST when token is not found", async () => {
    vi.mocked(getPasswordResetToken).mockResolvedValue(null);

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.resetPassword({ token: "invalid-token", password: "newpassword123" })
    ).rejects.toThrow("Invalid or expired reset link");
  });

  it("throws BAD_REQUEST when token has already been used", async () => {
    vi.mocked(getPasswordResetToken).mockResolvedValue({
      id: 1,
      userId: 42,
      token: "used-token",
      expiresAt: new Date(Date.now() + 3600_000),
      usedAt: new Date(), // already used
      createdAt: new Date(),
    });

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.resetPassword({ token: "used-token", password: "newpassword123" })
    ).rejects.toThrow("already been used");
  });

  it("throws BAD_REQUEST when token has expired", async () => {
    vi.mocked(getPasswordResetToken).mockResolvedValue({
      id: 1,
      userId: 42,
      token: "expired-token",
      expiresAt: new Date(Date.now() - 1000), // expired
      usedAt: null,
      createdAt: new Date(),
    });

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.resetPassword({ token: "expired-token", password: "newpassword123" })
    ).rejects.toThrow("expired");
  });

  it("updates password and marks token used on valid token", async () => {
    vi.mocked(getPasswordResetToken).mockResolvedValue({
      id: 1,
      userId: 42,
      token: "valid-token",
      expiresAt: new Date(Date.now() + 3600_000), // 1 hour from now
      usedAt: null,
      createdAt: new Date(),
    });
    vi.mocked(updateUserPassword).mockResolvedValue(undefined);
    vi.mocked(markPasswordResetTokenUsed).mockResolvedValue(undefined);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.auth.resetPassword({
      token: "valid-token",
      password: "newpassword123",
    });

    expect(result).toEqual({ success: true });
    expect(updateUserPassword).toHaveBeenCalledWith(42, expect.any(String));
    expect(markPasswordResetTokenUsed).toHaveBeenCalledWith("valid-token");
  });

  it("rejects passwords shorter than 8 characters", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.auth.resetPassword({ token: "some-token", password: "short" })
    ).rejects.toThrow();
  });
});
