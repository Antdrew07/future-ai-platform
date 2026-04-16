import { describe, expect, it, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Mock DB helpers ──────────────────────────────────────────────────────────
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  getUserByEmail: vi.fn(),
  createUserWithPassword: vi.fn(),
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
  getUserCreditBalance: vi.fn().mockResolvedValue(5000),
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
  routeLLMCall: vi.fn().mockResolvedValue({
    content: "Test response",
    inputTokens: 10,
    outputTokens: 20,
    creditsUsed: 5,
    modelId: "gpt-4o-mini",
  }),
}));

// ─── Test Context Factories ───────────────────────────────────────────────────
type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: "email_testuserid123",
    email: "test@future.ai",
    name: "Test User",
    loginMethod: "email",
    passwordHash: "$2b$12$hashedpassword",
    avatar: null,
    creditBalance: 0,
    apiQuota: 100,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function makeAdminUser(): AuthenticatedUser {
  return makeUser({ id: 99, role: "admin", email: "admin@future.ai", name: "Admin User" });
}

function makeCtx(user: AuthenticatedUser | null = null): TrpcContext {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
}

// ─── Auth Tests ───────────────────────────────────────────────────────────────
describe("auth", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("me returns user for authenticated user", async () => {
    const user = makeUser();
    const caller = appRouter.createCaller(makeCtx(user));
    const result = await caller.auth.me();
    expect(result).toMatchObject({ id: 1, email: "test@future.ai" });
  });

  it("logout clears session cookie", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      user: makeUser(),
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});

// ─── Agents Tests ─────────────────────────────────────────────────────────────
describe("agents", () => {
  it("list returns empty array for new user", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    const result = await caller.agents.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("publicList returns public agents", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.agents.publicList();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create requires authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.agents.create({
        name: "Test Agent",
        systemPrompt: "You are a helpful assistant",
        modelId: "gpt-4o-mini",
      })
    ).rejects.toThrow();
  });
});

// ─── Credits Tests ────────────────────────────────────────────────────────────
describe("credits", () => {
  it("balance returns credit balance for authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    const balance = await caller.credits.balance();
    expect(typeof balance).toBe("number");
    expect(balance).toBe(5000);
  });

  it("packs returns available credit packs (public)", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const packs = await caller.credits.packs();
    expect(Array.isArray(packs)).toBe(true);
  });

  it("plans returns subscription plans (public)", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const plans = await caller.credits.plans();
    expect(Array.isArray(plans)).toBe(true);
  });

  it("checkout creates Stripe session for authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    const result = await caller.credits.checkout({
      credits: 10000,
      priceUsd: 5,
      packName: "Starter Pack",
      origin: "https://future.ai",
    });
    expect(result).toHaveProperty("url");
    expect(result.url).toContain("stripe.com");
  });

  it("checkout requires authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(
      caller.credits.checkout({
        credits: 10000,
        priceUsd: 5,
        packName: "Starter",
        origin: "https://future.ai",
      })
    ).rejects.toThrow();
  });

  it("addBonus requires admin role", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    await expect(
      caller.credits.addBonus({ userId: 2, amount: 1000, description: "Test" })
    ).rejects.toThrow();
  });

  it("addBonus succeeds for admin", async () => {
    const { addCredits } = await import("./db");
    vi.mocked(addCredits).mockResolvedValueOnce(6000);
    const caller = appRouter.createCaller(makeCtx(makeAdminUser()));
    const result = await caller.credits.addBonus({ userId: 2, amount: 1000, description: "Test bonus" });
    expect(result).toMatchObject({ success: true });
  });
});

// ─── API Keys Tests ───────────────────────────────────────────────────────────
describe("apiKeys", () => {
  it("list returns empty array for new user", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    const result = await caller.apiKeys.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create generates a key with fut_live_ prefix", async () => {
    const { createApiKey } = await import("./db");
    vi.mocked(createApiKey).mockResolvedValueOnce(undefined);
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    const result = await caller.apiKeys.create({ name: "Test Key" });
    expect(result.key).toMatch(/^fut_live_/);
    expect(result.prefix).toMatch(/^fut_live_/);
  });

  it("create requires authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.apiKeys.create({ name: "Test" })).rejects.toThrow();
  });
});

// ─── Analytics Tests ──────────────────────────────────────────────────────────
describe("analytics", () => {
  it("usage returns analytics data", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    const result = await caller.analytics.usage({ days: 7 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("summary returns aggregated stats", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    const result = await caller.analytics.summary();
    expect(result).toHaveProperty("agentCount");
    expect(result).toHaveProperty("taskCount");
    expect(result).toHaveProperty("creditBalance");
  });
});

// ─── Admin Tests ──────────────────────────────────────────────────────────────
describe("admin", () => {
  it("stats requires admin role", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    await expect(caller.admin.stats()).rejects.toThrow();
  });

  it("stats returns system stats for admin", async () => {
    const caller = appRouter.createCaller(makeCtx(makeAdminUser()));
    const result = await caller.admin.stats();
    expect(result).toHaveProperty("userCount");
    expect(result).toHaveProperty("agentCount");
  });

  it("users requires admin role", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    await expect(caller.admin.users({ limit: 10, offset: 0 })).rejects.toThrow();
  });
});

// ─── Teams Tests ──────────────────────────────────────────────────────────────
describe("teams", () => {
  it("list returns empty array for new user", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    const result = await caller.teams.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("list requires authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.teams.list()).rejects.toThrow();
  });
});

// ─── Templates Tests ──────────────────────────────────────────────────────────
describe("templates", () => {
  it("list is public and returns templates", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.templates.list({ limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("myTemplates requires authentication", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.templates.myTemplates()).rejects.toThrow();
  });
});
