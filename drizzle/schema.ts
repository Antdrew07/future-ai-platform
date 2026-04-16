import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  bigint,
  json,
  float,
  index,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: varchar("passwordHash", { length: 256 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  creditBalance: bigint("creditBalance", { mode: "number" }).default(0).notNull(),
  apiQuota: int("apiQuota").default(100).notNull(), // monthly API calls limit
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Model Pricing ────────────────────────────────────────────────────────────
export const modelPricing = mysqlTable("model_pricing", {
  id: int("id").autoincrement().primaryKey(),
  modelId: varchar("modelId", { length: 64 }).notNull().unique(), // e.g. "gpt-4o", "claude-3-5-sonnet"
  displayName: varchar("displayName", { length: 128 }).notNull(),
  provider: mysqlEnum("provider", ["openai", "anthropic", "manus", "future", "custom", "perplexity", "gemini", "groq"]).notNull(),
  tier: mysqlEnum("tier", ["standard", "premium", "ultra"]).default("standard").notNull(),
  creditsPerInputToken: float("creditsPerInputToken").default(0.001).notNull(),  // credits per 1 token
  creditsPerOutputToken: float("creditsPerOutputToken").default(0.002).notNull(),
  creditsPerToolCall: float("creditsPerToolCall").default(1.0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  contextWindow: int("contextWindow").default(128000).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ModelPricing = typeof modelPricing.$inferSelect;

// ─── Agents ───────────────────────────────────────────────────────────────────
export const agents = mysqlTable("agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  teamId: int("teamId"),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 256 }).notNull(),
  description: text("description"),
  avatar: text("avatar"),
  systemPrompt: text("systemPrompt").notNull(),
  modelId: varchar("modelId", { length: 64 }).default("gpt-4o").notNull(),
  memoryEnabled: boolean("memoryEnabled").default(false).notNull(),
  isPublic: boolean("isPublic").default(false).notNull(),
  isDeployed: boolean("isDeployed").default(false).notNull(),
  // Tool toggles
  webSearchEnabled: boolean("webSearchEnabled").default(false).notNull(),
  codeExecutionEnabled: boolean("codeExecutionEnabled").default(false).notNull(),
  fileUploadEnabled: boolean("fileUploadEnabled").default(false).notNull(),
  apiCallsEnabled: boolean("apiCallsEnabled").default(false).notNull(),
  // Config
  maxSteps: int("maxSteps").default(10).notNull(),
  temperature: float("temperature").default(0.7).notNull(),
  customInstructions: text("customInstructions"),
  // Stats
  totalRuns: int("totalRuns").default(0).notNull(),
  totalCreditsUsed: bigint("totalCreditsUsed", { mode: "number" }).default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("agent_user_idx").on(table.userId),
  slugIdx: index("agent_slug_idx").on(table.slug),
}));

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

// ─── Tasks (Autonomous Runs) ──────────────────────────────────────────────────
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  input: text("input").notNull(),
  output: text("output"),
  status: mysqlEnum("status", ["queued", "running", "completed", "failed", "cancelled"]).default("queued").notNull(),
  creditsUsed: bigint("creditsUsed", { mode: "number" }).default(0).notNull(),
  inputTokens: int("inputTokens").default(0).notNull(),
  outputTokens: int("outputTokens").default(0).notNull(),
  toolCallCount: int("toolCallCount").default(0).notNull(),
  stepCount: int("stepCount").default(0).notNull(),
  errorMessage: text("errorMessage"),
  metadata: json("metadata"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  agentIdx: index("task_agent_idx").on(table.agentId),
  userIdx: index("task_user_idx").on(table.userId),
  statusIdx: index("task_status_idx").on(table.status),
}));

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ─── Task Steps (Execution Log) ───────────────────────────────────────────────
export const taskSteps = mysqlTable("task_steps", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  stepNumber: int("stepNumber").notNull(),
  type: mysqlEnum("type", ["thought", "tool_call", "tool_result", "llm_response", "error", "final"]).notNull(),
  content: text("content").notNull(),
  toolName: varchar("toolName", { length: 64 }),
  toolInput: json("toolInput"),
  toolOutput: json("toolOutput"),
  creditsUsed: float("creditsUsed").default(0).notNull(),
  durationMs: int("durationMs"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  taskIdx: index("step_task_idx").on(table.taskId),
}));

export type TaskStep = typeof taskSteps.$inferSelect;

// ─── Conversations (Chat Mode) ────────────────────────────────────────────────
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  userId: int("userId"),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  title: varchar("title", { length: 512 }),
  creditsUsed: bigint("creditsUsed", { mode: "number" }).default(0).notNull(),
  messageCount: int("messageCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  agentIdx: index("conv_agent_idx").on(table.agentId),
  sessionIdx: index("conv_session_idx").on(table.sessionId),
}));

export type Conversation = typeof conversations.$inferSelect;

// ─── Messages ─────────────────────────────────────────────────────────────────
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system", "tool"]).notNull(),
  content: text("content").notNull(),
  toolName: varchar("toolName", { length: 64 }),
  inputTokens: int("inputTokens").default(0).notNull(),
  outputTokens: int("outputTokens").default(0).notNull(),
  creditsUsed: float("creditsUsed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  convIdx: index("msg_conv_idx").on(table.conversationId),
}));

export type Message = typeof messages.$inferSelect;

// ─── Credits & Billing ────────────────────────────────────────────────────────
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["purchase", "usage", "refund", "bonus", "subscription"]).notNull(),
  amount: bigint("amount", { mode: "number" }).notNull(), // positive = credit, negative = debit
  balanceAfter: bigint("balanceAfter", { mode: "number" }).notNull(),
  description: varchar("description", { length: 512 }),
  taskId: int("taskId"),
  stripePaymentId: varchar("stripePaymentId", { length: 256 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("txn_user_idx").on(table.userId),
}));

export type CreditTransaction = typeof creditTransactions.$inferSelect;

// ─── Credit Packs (Products) ──────────────────────────────────────────────────
export const creditPacks = mysqlTable("credit_packs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  credits: bigint("credits", { mode: "number" }).notNull(),
  priceUsd: float("priceUsd").notNull(),
  stripePriceId: varchar("stripePriceId", { length: 256 }),
  isPopular: boolean("isPopular").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CreditPack = typeof creditPacks.$inferSelect;

// ─── Subscription Plans ───────────────────────────────────────────────────────
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  monthlyCredits: bigint("monthlyCredits", { mode: "number" }).notNull(),
  priceUsd: float("priceUsd").notNull(),
  stripePriceId: varchar("stripePriceId", { length: 256 }),
  maxAgents: int("maxAgents").default(5).notNull(),
  maxTeamMembers: int("maxTeamMembers").default(1).notNull(),
  features: json("features"), // array of feature strings
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// ─── User Subscriptions ───────────────────────────────────────────────────────
export const userSubscriptions = mysqlTable("user_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  planId: int("planId").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 256 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 256 }),
  status: mysqlEnum("status", ["active", "cancelled", "past_due", "trialing"]).default("active").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSubscription = typeof userSubscriptions.$inferSelect;

// ─── API Keys ─────────────────────────────────────────────────────────────────
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  keyHash: varchar("keyHash", { length: 256 }).notNull().unique(), // hashed key
  keyPrefix: varchar("keyPrefix", { length: 16 }).notNull(), // e.g. "fut_live_xxxx"
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  totalCalls: int("totalCalls").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("apikey_user_idx").on(table.userId),
  hashIdx: index("apikey_hash_idx").on(table.keyHash),
}));

export type ApiKey = typeof apiKeys.$inferSelect;

// ─── Teams ────────────────────────────────────────────────────────────────────
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  avatar: text("avatar"),
  creditBalance: bigint("creditBalance", { mode: "number" }).default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;

// ─── Team Members ─────────────────────────────────────────────────────────────
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["owner", "admin", "member", "viewer"]).default("member").notNull(),
  inviteEmail: varchar("inviteEmail", { length: 320 }),
  inviteToken: varchar("inviteToken", { length: 128 }),
  status: mysqlEnum("status", ["active", "invited", "removed"]).default("invited").notNull(),
  joinedAt: timestamp("joinedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  teamIdx: index("member_team_idx").on(table.teamId),
  userIdx: index("member_user_idx").on(table.userId),
}));

export type TeamMember = typeof teamMembers.$inferSelect;

// ─── Templates Marketplace ────────────────────────────────────────────────────
export const templates = mysqlTable("templates", {
  id: int("id").autoincrement().primaryKey(),
  authorId: int("authorId").notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  longDescription: text("longDescription"),
  category: varchar("category", { length: 64 }).notNull(),
  tags: json("tags"), // string[]
  agentConfig: json("agentConfig").notNull(), // serialized agent config
  previewImage: text("previewImage"),
  priceCredits: int("priceCredits").default(0).notNull(), // 0 = free
  installCount: int("installCount").default(0).notNull(),
  rating: float("rating").default(0).notNull(),
  ratingCount: int("ratingCount").default(0).notNull(),
  isApproved: boolean("isApproved").default(false).notNull(),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  authorIdx: index("tmpl_author_idx").on(table.authorId),
  categoryIdx: index("tmpl_category_idx").on(table.category),
}));

export type Template = typeof templates.$inferSelect;

// ─── Template Installs ────────────────────────────────────────────────────────
export const templateInstalls = mysqlTable("template_installs", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  userId: int("userId").notNull(),
  agentId: int("agentId"), // created agent from template
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Usage Analytics (Daily Rollup) ──────────────────────────────────────────
export const usageAnalytics = mysqlTable("usage_analytics", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  agentId: int("agentId"),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  taskCount: int("taskCount").default(0).notNull(),
  messageCount: int("messageCount").default(0).notNull(),
  inputTokens: bigint("inputTokens", { mode: "number" }).default(0).notNull(),
  outputTokens: bigint("outputTokens", { mode: "number" }).default(0).notNull(),
  creditsUsed: bigint("creditsUsed", { mode: "number" }).default(0).notNull(),
  toolCallCount: int("toolCallCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userDateIdx: index("analytics_user_date_idx").on(table.userId, table.date),
}));

export type UsageAnalytics = typeof usageAnalytics.$inferSelect;
