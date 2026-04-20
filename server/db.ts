import { and, desc, eq, gte, lte, sql, like, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users, agents, tasks, taskSteps, conversations, messages,
  creditTransactions, creditPacks, subscriptionPlans, userSubscriptions,
  apiKeys, teams, teamMembers, templates, templateInstalls, usageAnalytics,
  modelPricing, passwordResetTokens,
  type Agent, type Task, type TaskStep, type CreditTransaction,
  type Template, type Team, type TeamMember, type ApiKey,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod", "avatar", "passwordHash"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    (values as Record<string, unknown>)[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function createUserWithPassword(data: {
  email: string;
  name: string;
  passwordHash: string;
  openId: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(users).values({
    openId: data.openId,
    email: data.email,
    name: data.name,
    passwordHash: data.passwordHash,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getAllUsers(limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
}

export async function getUserCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(users);
  return result[0]?.count ?? 0;
}

// ─── Agents ───────────────────────────────────────────────────────────────────
export async function createAgent(data: typeof agents.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(agents).values(data);
  return result;
}

export async function getAgentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agents).where(eq(agents.userId, userId)).orderBy(desc(agents.updatedAt));
}

export async function getAgentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agents).where(eq(agents.id, id)).limit(1);
  return result[0];
}

export async function getAgentBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agents).where(eq(agents.slug, slug)).limit(1);
  return result[0];
}

export async function updateAgent(id: number, data: Partial<typeof agents.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(agents).set(data).where(eq(agents.id, id));
}

export async function deleteAgent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(agents).where(eq(agents.id, id));
}

export async function getPublicAgents(limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agents)
    .where(and(eq(agents.isPublic, true), eq(agents.isDeployed, true)))
    .orderBy(desc(agents.totalRuns))
    .limit(limit).offset(offset);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export async function createTask(data: typeof tasks.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(data);
  return result;
}

export async function getTasksByUserId(userId: number, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(desc(tasks.createdAt))
    .limit(limit).offset(offset);
}

export async function getTasksByAgentId(agentId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks)
    .where(eq(tasks.agentId, agentId))
    .orderBy(desc(tasks.createdAt))
    .limit(limit);
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0];
}

export async function updateTask(id: number, data: Partial<typeof tasks.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function createTaskStep(data: typeof taskSteps.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(taskSteps).values(data);
}

export async function getTaskSteps(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taskSteps)
    .where(eq(taskSteps.taskId, taskId))
    .orderBy(taskSteps.stepNumber);
}

// ─── Conversations ────────────────────────────────────────────────────────────
export async function getOrCreateConversation(agentId: number, sessionId: string, userId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(conversations)
    .where(and(eq(conversations.agentId, agentId), eq(conversations.sessionId, sessionId)))
    .limit(1);
  if (existing[0]) return existing[0];
  await db.insert(conversations).values({ agentId, sessionId, userId });
  const created = await db.select().from(conversations)
    .where(and(eq(conversations.agentId, agentId), eq(conversations.sessionId, sessionId)))
    .limit(1);
  return created[0]!;
}

export async function getConversationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(50);
}

export async function addMessage(data: typeof messages.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(messages).values(data);
}

export async function getMessages(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
    .limit(200);
}

// ─── Credits ──────────────────────────────────────────────────────────────────
export async function getUserCreditBalance(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ balance: users.creditBalance }).from(users).where(eq(users.id, userId)).limit(1);
  return result[0]?.balance ?? 0;
}

export async function deductCredits(userId: number, amount: number, description: string, taskId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // ── Atomic deduction using conditional UPDATE ────────────────────────────────
  // Instead of READ-then-WRITE (which has a race condition), we use a single
  // UPDATE ... WHERE creditBalance >= amount. If the balance is insufficient,
  // the UPDATE affects 0 rows and we return false. This is fully atomic.
  const updateResult = await db.update(users)
    .set({ creditBalance: sql`creditBalance - ${amount}` })
    .where(and(eq(users.id, userId), sql`creditBalance >= ${amount}`));

  // Check if any row was actually updated (0 rows = insufficient balance)
  const rowsAffected = (updateResult as unknown as [{ affectedRows: number }])[0]?.affectedRows ?? 0;
  if (rowsAffected === 0) return false;

  // Fetch the new balance for the transaction log
  const balanceResult = await db.select({ balance: users.creditBalance }).from(users).where(eq(users.id, userId)).limit(1);
  const newBalance = balanceResult[0]?.balance ?? 0;

  await db.insert(creditTransactions).values({
    userId, type: "usage", amount: -amount, balanceAfter: newBalance, description, taskId,
  });
  return true;
}

export async function addCredits(userId: number, amount: number, type: "purchase" | "bonus" | "subscription" | "refund", description: string, stripePaymentId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // ── Atomic credit addition using SQL increment ────────────────────────────────
  // Use SQL-level increment to avoid READ-then-WRITE race conditions.
  await db.update(users)
    .set({ creditBalance: sql`creditBalance + ${amount}` })
    .where(eq(users.id, userId));

  // Fetch the authoritative new balance for the transaction log
  const balanceResult = await db.select({ balance: users.creditBalance }).from(users).where(eq(users.id, userId)).limit(1);
  const newBalance = balanceResult[0]?.balance ?? 0;

  await db.insert(creditTransactions).values({
    userId, type, amount, balanceAfter: newBalance, description, stripePaymentId,
  });
  return newBalance;
}

export async function getCreditTransactions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(desc(creditTransactions.createdAt))
    .limit(limit);
}

export async function getCreditPacks() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(creditPacks).where(eq(creditPacks.isActive, true));
}

export async function getSubscriptionPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, true));
}

// ─── Model Pricing ────────────────────────────────────────────────────────────
export async function getModelPricing() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(modelPricing).where(eq(modelPricing.isActive, true));
}

export async function getModelById(modelId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(modelPricing).where(eq(modelPricing.modelId, modelId)).limit(1);
  return result[0];
}

export async function upsertModelPricing(data: typeof modelPricing.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(modelPricing).values(data).onDuplicateKeyUpdate({ set: data });
}

// ─── API Keys ─────────────────────────────────────────────────────────────────
export async function createApiKey(data: typeof apiKeys.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(apiKeys).values(data);
}

export async function getApiKeysByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), eq(apiKeys.isActive, true)))
    .orderBy(desc(apiKeys.createdAt));
}

export async function getApiKeyByHash(keyHash: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(apiKeys)
    .where(and(eq(apiKeys.keyHash, keyHash), eq(apiKeys.isActive, true)))
    .limit(1);
  return result[0];
}

export async function revokeApiKey(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(apiKeys).set({ isActive: false }).where(and(eq(apiKeys.id, id), eq(apiKeys.userId, userId)));
}

// ─── Teams ────────────────────────────────────────────────────────────────────
export async function createTeam(data: typeof teams.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(teams).values(data);
}

export async function getTeamsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ team: teams, member: teamMembers })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(and(eq(teamMembers.userId, userId), eq(teamMembers.status, "active")));
}

export async function getTeamById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
  return result[0];
}

export async function getTeamMembers(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({ member: teamMembers, user: users })
    .from(teamMembers)
    .leftJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId));
}

export async function addTeamMember(data: typeof teamMembers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(teamMembers).values(data);
}

// ─── Templates ────────────────────────────────────────────────────────────────
export async function getTemplates(category?: string, limit = 20, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(templates.isApproved, true)];
  if (category && category !== "all") conditions.push(eq(templates.category, category));
  return db.select().from(templates)
    .where(and(...conditions))
    .orderBy(desc(templates.installCount))
    .limit(limit).offset(offset);
}

export async function getTemplateBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(templates).where(eq(templates.slug, slug)).limit(1);
  return result[0];
}

export async function createTemplate(data: typeof templates.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(templates).values(data);
}

export async function getTemplatesByAuthor(authorId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(templates).where(eq(templates.authorId, authorId)).orderBy(desc(templates.createdAt));
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function getUserAnalytics(userId: number, days = 30) {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0]!;
  return db.select().from(usageAnalytics)
    .where(and(eq(usageAnalytics.userId, userId), gte(usageAnalytics.date, sinceStr)))
    .orderBy(usageAnalytics.date);
}

export async function upsertDailyAnalytics(userId: number, agentId: number | undefined, date: string, delta: {
  taskCount?: number; messageCount?: number; inputTokens?: number; outputTokens?: number;
  creditsUsed?: number; toolCallCount?: number;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(usageAnalytics).values({
    userId, agentId, date,
    taskCount: delta.taskCount ?? 0,
    messageCount: delta.messageCount ?? 0,
    inputTokens: delta.inputTokens ?? 0,
    outputTokens: delta.outputTokens ?? 0,
    creditsUsed: delta.creditsUsed ?? 0,
    toolCallCount: delta.toolCallCount ?? 0,
  }).onDuplicateKeyUpdate({
    set: {
      taskCount: sql`taskCount + ${delta.taskCount ?? 0}`,
      messageCount: sql`messageCount + ${delta.messageCount ?? 0}`,
      inputTokens: sql`inputTokens + ${delta.inputTokens ?? 0}`,
      outputTokens: sql`outputTokens + ${delta.outputTokens ?? 0}`,
      creditsUsed: sql`creditsUsed + ${delta.creditsUsed ?? 0}`,
      toolCallCount: sql`toolCallCount + ${delta.toolCallCount ?? 0}`,
    },
  });
}

export async function getSystemStats() {
  const db = await getDb();
  if (!db) return null;
  const [userCount, agentCount, taskCount, totalCredits] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(agents),
    db.select({ count: sql<number>`count(*)` }).from(tasks),
    db.select({ total: sql<number>`sum(amount)` }).from(creditTransactions).where(eq(creditTransactions.type, "purchase")),
  ]);
  return {
    userCount: userCount[0]?.count ?? 0,
    agentCount: agentCount[0]?.count ?? 0,
    taskCount: taskCount[0]?.count ?? 0,
    totalCreditsPurchased: totalCredits[0]?.total ?? 0,
  };
}

// ─── Seed Default Data ────────────────────────────────────────────────────────
export async function seedDefaultData() {
  const db = await getDb();
  if (!db) return;

  // Seed model pricing
  const models = [
    { modelId: "gpt-4o", displayName: "Future-1 Pro", provider: "future" as const, tier: "premium" as const, creditsPerInputToken: 0.005, creditsPerOutputToken: 0.015, creditsPerToolCall: 2, contextWindow: 128000 },
    { modelId: "gpt-4o-mini", displayName: "Future-1 Mini", provider: "future" as const, tier: "standard" as const, creditsPerInputToken: 0.0002, creditsPerOutputToken: 0.0006, creditsPerToolCall: 0.5, contextWindow: 128000 },
    { modelId: "claude-3-5-sonnet-20241022", displayName: "Future-1 Code", provider: "future" as const, tier: "premium" as const, creditsPerInputToken: 0.003, creditsPerOutputToken: 0.015, creditsPerToolCall: 3, contextWindow: 200000 },
    { modelId: "claude-3-haiku-20240307", displayName: "Future-1 Fast", provider: "future" as const, tier: "standard" as const, creditsPerInputToken: 0.00025, creditsPerOutputToken: 0.00125, creditsPerToolCall: 0.5, contextWindow: 200000 },
    { modelId: "future-agent-1", displayName: "Future-1 Ultra", provider: "future" as const, tier: "ultra" as const, creditsPerInputToken: 0.001, creditsPerOutputToken: 0.003, creditsPerToolCall: 1, contextWindow: 200000 },
  ];
  for (const m of models) {
    await upsertModelPricing(m);
  }

  // Seed credit packs — upsert by name to prevent duplicates on server restart
  const packsToSeed = [
    { name: "Small Top-up",  credits: 1000,  priceUsd: 5,  isPopular: false },
    { name: "Medium Top-up", credits: 5000,  priceUsd: 19, isPopular: true },
    { name: "Large Top-up",  credits: 15000, priceUsd: 49, isPopular: false },
  ];
  for (const pack of packsToSeed) {
    const existing = await db.select().from(creditPacks).where(eq(creditPacks.name, pack.name)).limit(1);
    if (existing.length === 0) await db.insert(creditPacks).values(pack);
  }

  // Seed subscription plans — upsert by slug to prevent duplicates on server restart
  const plansToSeed = [
    { name: "Free",     slug: "free",     monthlyCredits: 500,    priceUsd: 0,  maxAgents: 1,   maxTeamMembers: 1,  features: ["1 project", "500 credits/month", "Basic AI tasks", "Community support"] },
    { name: "Starter",  slug: "starter",  monthlyCredits: 5000,   priceUsd: 9,  maxAgents: 5,   maxTeamMembers: 1,  features: ["5 projects", "5,000 credits/month", "All task types", "Email support"] },
    { name: "Pro",      slug: "pro",      monthlyCredits: 25000,  priceUsd: 29, maxAgents: 20,  maxTeamMembers: 5,  features: ["Unlimited projects", "25,000 credits/month", "Team collaboration", "API access", "Priority support"] },
    { name: "Business", slug: "business", monthlyCredits: 100000, priceUsd: 99, maxAgents: 100, maxTeamMembers: 25, features: ["Everything in Pro", "100,000 credits/month", "Advanced analytics", "Custom models", "Dedicated support", "SLA guarantee"] },
  ];
  for (const plan of plansToSeed) {
    const existing = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.slug, plan.slug)).limit(1);
    if (existing.length === 0) await db.insert(subscriptionPlans).values(plan);
  }
}

// ─── Password Reset Tokens ────────────────────────────────────────────────────
export async function createPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(passwordResetTokens).values({ userId, token, expiresAt });
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);
  return rows[0] ?? null;
}

export async function markPasswordResetTokenUsed(token: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.token, token));
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
}
