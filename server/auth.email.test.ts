import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB ──────────────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  getUserByEmail: vi.fn(),
  createUserWithPassword: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getUserById: vi.fn(),
  getAllUsers: vi.fn().mockResolvedValue([]),
  getUserCount: vi.fn().mockResolvedValue(0),
  createAgent: vi.fn(),
  getAgentsByUserId: vi.fn().mockResolvedValue([]),
  getAgentById: vi.fn(),
  getAgentBySlug: vi.fn(),
  updateAgent: vi.fn(),
  deleteAgent: vi.fn(),
  getPublicAgents: vi.fn().mockResolvedValue([]),
  createTask: vi.fn(),
  getTasksByUserId: vi.fn().mockResolvedValue([]),
  getTasksByAgentId: vi.fn().mockResolvedValue([]),
  getTaskById: vi.fn(),
  updateTask: vi.fn(),
  createTaskStep: vi.fn(),
  getTaskSteps: vi.fn().mockResolvedValue([]),
  getOrCreateConversation: vi.fn(),
  getConversationsByUserId: vi.fn().mockResolvedValue([]),
  addMessage: vi.fn(),
  getMessages: vi.fn().mockResolvedValue([]),
  getUserCreditBalance: vi.fn().mockResolvedValue(0),
  deductCredits: vi.fn(),
  addCredits: vi.fn(),
  getCreditTransactions: vi.fn().mockResolvedValue([]),
  getCreditPacks: vi.fn().mockResolvedValue([]),
  getSubscriptionPlans: vi.fn().mockResolvedValue([]),
  getModelPricing: vi.fn().mockResolvedValue([]),
  getModelById: vi.fn(),
  upsertModelPricing: vi.fn(),
  createApiKey: vi.fn(),
  getApiKeysByUserId: vi.fn().mockResolvedValue([]),
  getApiKeyByHash: vi.fn(),
  revokeApiKey: vi.fn(),
  createTeam: vi.fn(),
  getTeamsByUserId: vi.fn().mockResolvedValue([]),
  getTeamById: vi.fn(),
  getTeamMembers: vi.fn().mockResolvedValue([]),
  addTeamMember: vi.fn(),
  getTemplates: vi.fn().mockResolvedValue([]),
  getTemplateBySlug: vi.fn(),
  createTemplate: vi.fn(),
  getTemplatesByAuthor: vi.fn().mockResolvedValue([]),
  getUserAnalytics: vi.fn().mockResolvedValue([]),
  getSystemStats: vi.fn().mockResolvedValue({ userCount: 0, agentCount: 0, taskCount: 0, totalCreditsPurchased: 0 }),
  seedDefaultData: vi.fn(),
}));

vi.mock("./stripeWebhook", () => ({
  createCheckoutSession: vi.fn().mockResolvedValue("https://checkout.stripe.com/test"),
}));

vi.mock("./llmRouter", () => ({
  routeLLMCall: vi.fn().mockResolvedValue({ content: "ok", inputTokens: 1, outputTokens: 1, creditsUsed: 1, modelId: "gpt-4o-mini" }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function makeCtx(): TrpcContext & { setCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> } {
  const setCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
    setCookies,
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("auth.register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new user and sets a session cookie", async () => {
    const db = await import("./db");
    (db.getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined); // no existing user
    (db.createUserWithPassword as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);
    (db.getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 42,
      openId: "email_abc123",
      email: "new@future.ai",
      name: "New User",
      role: "user",
      loginMethod: "email",
      passwordHash: "$2b$12$hash",
      avatar: null,
      creditBalance: 0,
      apiQuota: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });

    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.register({
      name: "New User",
      email: "new@future.ai",
      password: "securepassword123",
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("new@future.ai");
    // A session cookie should have been set
    expect(ctx.setCookies).toHaveLength(1);
    expect(ctx.setCookies[0]?.name).toBe(COOKIE_NAME);
    expect(ctx.setCookies[0]?.options).toMatchObject({ httpOnly: true, sameSite: "none" });
  });

  it("throws CONFLICT if email already exists", async () => {
    const db = await import("./db");
    (db.getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 1, email: "existing@future.ai",
    });

    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({ name: "Dup", email: "existing@future.ai", password: "password123" })
    ).rejects.toThrow("An account with this email already exists");
  });

  it("rejects passwords shorter than 8 characters", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.register({ name: "Short", email: "short@future.ai", password: "abc" })
    ).rejects.toThrow();
  });
});

describe("auth.login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sets a session cookie on valid credentials", async () => {
    // bcryptjs hash of "correctpassword"
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("correctpassword", 10);

    const db = await import("./db");
    (db.getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 5,
      openId: "email_user5",
      email: "user@future.ai",
      name: "Login User",
      role: "user",
      loginMethod: "email",
      passwordHash: hash,
      avatar: null,
      creditBalance: 0,
      apiQuota: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    });
    (db.upsertUser as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.login({ email: "user@future.ai", password: "correctpassword" });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe("user@future.ai");
    expect(ctx.setCookies).toHaveLength(1);
    expect(ctx.setCookies[0]?.name).toBe(COOKIE_NAME);
  });

  it("throws UNAUTHORIZED for wrong password", async () => {
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.hash("correctpassword", 10);

    const db = await import("./db");
    (db.getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: 5,
      openId: "email_user5",
      email: "user@future.ai",
      passwordHash: hash,
    });

    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({ email: "user@future.ai", password: "wrongpassword" })
    ).rejects.toThrow("Invalid email or password");
  });

  it("throws UNAUTHORIZED for unknown email", async () => {
    const db = await import("./db");
    (db.getUserByEmail as ReturnType<typeof vi.fn>).mockResolvedValueOnce(undefined);

    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.auth.login({ email: "nobody@future.ai", password: "anypassword" })
    ).rejects.toThrow("Invalid email or password");
  });
});
