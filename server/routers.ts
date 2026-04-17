import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";
import { nanoid } from "nanoid";
import { createHash } from "crypto";
import {
  upsertUser, getUserByOpenId, getUserByEmail, createUserWithPassword, getUserById, getAllUsers, getUserCount,
  createPasswordResetToken, getPasswordResetToken, markPasswordResetTokenUsed, updateUserPassword,
  createAgent, getAgentsByUserId, getAgentById, getAgentBySlug, updateAgent, deleteAgent, getPublicAgents,
  createTask, getTasksByUserId, getTasksByAgentId, getTaskById, updateTask, createTaskStep, getTaskSteps,
  getOrCreateConversation, getConversationsByUserId, addMessage, getMessages,
  getUserCreditBalance, deductCredits, addCredits, getCreditTransactions, getCreditPacks, getSubscriptionPlans,
  getModelPricing, getModelById, upsertModelPricing,
  createApiKey, getApiKeysByUserId, getApiKeyByHash, revokeApiKey,
  createTeam, getTeamsByUserId, getTeamById, getTeamMembers, addTeamMember,
  getTemplates, getTemplateBySlug, createTemplate, getTemplatesByAuthor,
  getUserAnalytics, getSystemStats, seedDefaultData,
} from "./db";
import { routeLLMCall } from "./llmRouter";
import { sendEmail, buildPasswordResetEmail } from "./email";
import { invokeLLM } from "./_core/llm";
import { createCheckoutSession } from "./stripeWebhook";
import bcrypt from "bcryptjs";
import { sdk } from "./_core/sdk";
import { ONE_YEAR_MS } from "@shared/const";

// ─── Admin Middleware ─────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  // ─── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    register: publicProcedure.input(z.object({
      name: z.string().min(1).max(128),
      email: z.string().email(),
      password: z.string().min(8, "Password must be at least 8 characters"),
    })).mutation(async ({ ctx, input }) => {
      // Check if email already in use
      const existing = await getUserByEmail(input.email);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" });

      const passwordHash = await bcrypt.hash(input.password, 12);
      const openId = `email_${nanoid(24)}`;
      await createUserWithPassword({ email: input.email, name: input.name, passwordHash, openId });

      const user = await getUserByEmail(input.email);
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });

      // Grant 100 free starter credits
      await addCredits(user.id, 100, "bonus", "Welcome gift — 100 free credits to get you started");

      // Issue session cookie
      const sessionToken = await sdk.signSession({ openId, appId: "future", name: input.name }, { expiresInMs: ONE_YEAR_MS });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),

    login: publicProcedure.input(z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const user = await getUserByEmail(input.email);
      if (!user || !user.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });

      // Update lastSignedIn
      await upsertUser({ openId: user.openId, lastSignedIn: new Date() });

      // Issue session cookie
      const sessionToken = await sdk.signSession({ openId: user.openId, appId: "future", name: user.name ?? "" }, { expiresInMs: ONE_YEAR_MS });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),

    forgotPassword: publicProcedure.input(z.object({
      email: z.string().email(),
      origin: z.string().url(),
    })).mutation(async ({ input }) => {
      // Always return success to prevent email enumeration
      const user = await getUserByEmail(input.email);
      if (!user) return { success: true };

      // Generate a secure random token (48 bytes → 96 hex chars)
      const { randomBytes } = await import("crypto");
      const token = randomBytes(48).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await createPasswordResetToken(user.id, token, expiresAt);

      const resetUrl = `${input.origin}/reset-password?token=${token}`;
      const { subject, html, text } = buildPasswordResetEmail({
        name: user.name ?? "there",
        resetUrl,
        expiresInMinutes: 60,
      });

      await sendEmail({ to: input.email, subject, html, text });

      return { success: true };
    }),

    resetPassword: publicProcedure.input(z.object({
      token: z.string().min(1),
      password: z.string().min(8, "Password must be at least 8 characters"),
    })).mutation(async ({ input }) => {
      const record = await getPasswordResetToken(input.token);

      if (!record) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset link" });
      if (record.usedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link has already been used" });
      if (new Date() > record.expiresAt) throw new TRPCError({ code: "BAD_REQUEST", message: "This reset link has expired. Please request a new one." });

      const passwordHash = await bcrypt.hash(input.password, 12);
      await updateUserPassword(record.userId, passwordHash);
      await markPasswordResetTokenUsed(input.token);

      return { success: true };
    }),
  }),

  // ─── Agents ────────────────────────────────────────────────────────────────
  agents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getAgentsByUserId(ctx.user.id);
    }),

    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const agent = await getAgentById(input.id);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND" });
      if (agent.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return agent;
    }),

    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const agent = await getAgentBySlug(input.slug);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND" });
      if (!agent.isPublic) throw new TRPCError({ code: "FORBIDDEN", message: "This agent is private" });
      return agent;
    }),

    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(256),
      description: z.string().optional(),
      systemPrompt: z.string().min(1),
      modelId: z.string().default("gpt-4o"),
      memoryEnabled: z.boolean().default(false),
      webSearchEnabled: z.boolean().default(false),
      codeExecutionEnabled: z.boolean().default(false),
      fileUploadEnabled: z.boolean().default(false),
      apiCallsEnabled: z.boolean().default(false),
      temperature: z.number().min(0).max(2).default(0.7),
      maxSteps: z.number().min(1).max(50).default(10),
    })).mutation(async ({ ctx, input }) => {
      const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${nanoid(6)}`;
      await createAgent({ ...input, userId: ctx.user.id, slug });
      const agent = await getAgentBySlug(slug);
      return agent!;
    }),

    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).max(256).optional(),
      description: z.string().optional(),
      systemPrompt: z.string().optional(),
      modelId: z.string().optional(),
      memoryEnabled: z.boolean().optional(),
      isPublic: z.boolean().optional(),
      isDeployed: z.boolean().optional(),
      webSearchEnabled: z.boolean().optional(),
      codeExecutionEnabled: z.boolean().optional(),
      fileUploadEnabled: z.boolean().optional(),
      apiCallsEnabled: z.boolean().optional(),
      temperature: z.number().min(0).max(2).optional(),
      maxSteps: z.number().min(1).max(50).optional(),
    })).mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const agent = await getAgentById(id);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND" });
      if (agent.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await updateAgent(id, data);
      return getAgentById(id);
    }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const agent = await getAgentById(input.id);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND" });
      if (agent.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await deleteAgent(input.id);
      return { success: true };
    }),

    deploy: protectedProcedure.input(z.object({ id: z.number(), isDeployed: z.boolean() })).mutation(async ({ ctx, input }) => {
      const agent = await getAgentById(input.id);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND" });
      if (agent.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await updateAgent(input.id, { isDeployed: input.isDeployed });
      return { success: true, slug: agent.slug };
    }),

    publicList: publicProcedure.query(async () => {
      return getPublicAgents(20, 0);
    }),
  }),

  // ─── Tasks ─────────────────────────────────────────────────────────────────
  tasks: router({
    list: protectedProcedure.input(z.object({ limit: z.number().default(20), offset: z.number().default(0) })).query(async ({ ctx, input }) => {
      return getTasksByUserId(ctx.user.id, input.limit, input.offset);
    }),

    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const task = await getTaskById(input.id);
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      if (task.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return task;
    }),

    getSteps: protectedProcedure.input(z.object({ taskId: z.number() })).query(async ({ ctx, input }) => {
      const task = await getTaskById(input.taskId);
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      if (task.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      return getTaskSteps(input.taskId);
    }),

    run: protectedProcedure.input(z.object({
      agentId: z.number(),
      input: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const agent = await getAgentById(input.agentId);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND" });
      if (agent.userId !== ctx.user.id && !agent.isPublic) throw new TRPCError({ code: "FORBIDDEN" });

      const balance = await getUserCreditBalance(ctx.user.id);
      if (balance < 10) throw new TRPCError({ code: "PAYMENT_REQUIRED", message: "Insufficient credits. Please purchase more credits to continue." });

      // Create task record
      await createTask({
        agentId: input.agentId,
        userId: ctx.user.id,
        title: input.input.slice(0, 100),
        input: input.input,
        status: "running",
        startedAt: new Date(),
      });

      const taskResult = await getTasksByUserId(ctx.user.id, 1, 0);
      const task = taskResult[0]!;

      // Execute agent with multi-step reasoning
      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: agent.systemPrompt },
        { role: "user", content: input.input },
      ];

      let stepNumber = 0;
      let totalCredits = 0;
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let finalOutput = "";

      try {
        // Step 1: Initial thought
        await createTaskStep({
          taskId: task.id,
          stepNumber: ++stepNumber,
          type: "thought",
          content: `Processing task: "${input.input.slice(0, 200)}"`,
          creditsUsed: 0,
        });

        // Step 2: LLM call
        const result = await routeLLMCall({
          modelId: agent.modelId,
          messages,
          userId: ctx.user.id,
          agentId: input.agentId,
          taskId: task.id,
        });

        totalCredits += result.creditsUsed;
        totalInputTokens += result.inputTokens;
        totalOutputTokens += result.outputTokens;
        finalOutput = result.content;

        await createTaskStep({
          taskId: task.id,
          stepNumber: ++stepNumber,
          type: "llm_response",
          content: result.content,
          creditsUsed: result.creditsUsed,
        });

        await createTaskStep({
          taskId: task.id,
          stepNumber: ++stepNumber,
          type: "final",
          content: result.content,
          creditsUsed: 0,
        });

        await updateTask(task.id, {
          status: "completed",
          output: finalOutput,
          creditsUsed: totalCredits,
          inputTokens: totalInputTokens,
          outputTokens: totalOutputTokens,
          stepCount: stepNumber,
          completedAt: new Date(),
        });

        // Update agent stats
        await updateAgent(input.agentId, {
          totalRuns: agent.totalRuns + 1,
          totalCreditsUsed: agent.totalCreditsUsed + totalCredits,
        });

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        await updateTask(task.id, {
          status: "failed",
          errorMessage: errorMsg,
          completedAt: new Date(),
        });
        await createTaskStep({
          taskId: task.id,
          stepNumber: ++stepNumber,
          type: "error",
          content: errorMsg,
          creditsUsed: 0,
        });
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: errorMsg });
      }

      return { taskId: task.id, output: finalOutput, creditsUsed: totalCredits };
    }),

    cancel: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const task = await getTaskById(input.id);
      if (!task) throw new TRPCError({ code: "NOT_FOUND" });
      if (task.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });
      await updateTask(input.id, { status: "cancelled", completedAt: new Date() });
      return { success: true };
    }),
  }),

  // ─── Chat (Conversation Mode) ───────────────────────────────────────────────
  chat: router({
    send: protectedProcedure.input(z.object({
      agentId: z.number(),
      sessionId: z.string(),
      message: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const agent = await getAgentById(input.agentId);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND" });

      const balance = await getUserCreditBalance(ctx.user.id);
      if (balance < 5) throw new TRPCError({ code: "PAYMENT_REQUIRED", message: "Insufficient credits" });

      const conv = await getOrCreateConversation(input.agentId, input.sessionId, ctx.user.id);
      const history = await getMessages(conv.id);

      const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
        { role: "system", content: agent.systemPrompt },
        ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user", content: input.message },
      ];

      await addMessage({ conversationId: conv.id, role: "user", content: input.message });

      const result = await routeLLMCall({
        modelId: agent.modelId,
        messages,
        userId: ctx.user.id,
        agentId: input.agentId,
      });

      await addMessage({
        conversationId: conv.id,
        role: "assistant",
        content: result.content,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        creditsUsed: result.creditsUsed,
      });

      return { content: result.content, creditsUsed: result.creditsUsed };
    }),

    history: protectedProcedure.input(z.object({ agentId: z.number(), sessionId: z.string() })).query(async ({ ctx, input }) => {
      const conv = await getOrCreateConversation(input.agentId, input.sessionId, ctx.user.id);
      return getMessages(conv.id);
    }),

    conversations: protectedProcedure.query(async ({ ctx }) => {
      return getConversationsByUserId(ctx.user.id);
    }),
  }),

  // ─── Credits ───────────────────────────────────────────────────────────────
  credits: router({
    balance: protectedProcedure.query(async ({ ctx }) => {
      return getUserCreditBalance(ctx.user.id);
    }),

    transactions: protectedProcedure.input(z.object({ limit: z.number().default(50) })).query(async ({ ctx, input }) => {
      return getCreditTransactions(ctx.user.id, input.limit);
    }),

    packs: publicProcedure.query(async () => {
      return getCreditPacks();
    }),

    plans: publicProcedure.query(async () => {
      return getSubscriptionPlans();
    }),

    checkout: protectedProcedure.input(z.object({
      credits: z.number().positive(),
      priceUsd: z.number().positive(),
      packName: z.string(),
      origin: z.string().url(),
    })).mutation(async ({ ctx, input }) => {
      const url = await createCheckoutSession({
        userId: ctx.user.id,
        userEmail: ctx.user.email ?? "",
        userName: ctx.user.name ?? "User",
        credits: input.credits,
        priceUsd: input.priceUsd,
        packName: input.packName,
        origin: input.origin,
      });
      if (!url) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create checkout session" });
      return { url };
    }),

    // Manual credit add (admin or for testing)
    addBonus: adminProcedure.input(z.object({
      userId: z.number(),
      amount: z.number().positive(),
      description: z.string(),
    })).mutation(async ({ input }) => {
      const newBalance = await addCredits(input.userId, input.amount, "bonus", input.description);
      return { success: true, newBalance };
    }),
  }),

  // ─── Models ────────────────────────────────────────────────────────────────
  models: router({
    list: publicProcedure.query(async () => {
      return getModelPricing();
    }),
  }),

  // ─── Analytics ─────────────────────────────────────────────────────────────
  analytics: router({
    usage: protectedProcedure.input(z.object({ days: z.number().default(30) })).query(async ({ ctx, input }) => {
      return getUserAnalytics(ctx.user.id, input.days);
    }),

    summary: protectedProcedure.query(async ({ ctx }) => {
      const [tasks30, balance, agents] = await Promise.all([
        getTasksByUserId(ctx.user.id, 100, 0),
        getUserCreditBalance(ctx.user.id),
        getAgentsByUserId(ctx.user.id),
      ]);
      const completedTasks = tasks30.filter(t => t.status === "completed").length;
      const totalCreditsUsed = tasks30.reduce((acc, t) => acc + t.creditsUsed, 0);
      return {
        agentCount: agents.length,
        taskCount: tasks30.length,
        completedTasks,
        creditBalance: balance,
        totalCreditsUsed,
        activeAgents: agents.filter(a => a.isDeployed).length,
      };
    }),
  }),

  // ─── API Keys ──────────────────────────────────────────────────────────────
  apiKeys: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getApiKeysByUserId(ctx.user.id);
    }),

    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(128),
    })).mutation(async ({ ctx, input }) => {
      const rawKey = `fut_live_${nanoid(32)}`;
      const keyHash = createHash("sha256").update(rawKey).digest("hex");
      const keyPrefix = rawKey.slice(0, 16);
      await createApiKey({ userId: ctx.user.id, name: input.name, keyHash, keyPrefix });
      return { key: rawKey, prefix: keyPrefix }; // Only time full key is shown
    }),

    revoke: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await revokeApiKey(input.id, ctx.user.id);
      return { success: true };
    }),
  }),

  // ─── Teams ─────────────────────────────────────────────────────────────────
  teams: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getTeamsByUserId(ctx.user.id);
    }),

    create: protectedProcedure.input(z.object({
      name: z.string().min(1).max(256),
    })).mutation(async ({ ctx, input }) => {
      const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${nanoid(6)}`;
      await createTeam({ ownerId: ctx.user.id, name: input.name, slug });
      const team = await getTeamsByUserId(ctx.user.id);
      // Add owner as member
      const newTeam = team[team.length - 1];
      if (newTeam) {
        await addTeamMember({ teamId: newTeam.team.id, userId: ctx.user.id, role: "owner", status: "active", joinedAt: new Date() });
      }
      return newTeam;
    }),

    members: protectedProcedure.input(z.object({ teamId: z.number() })).query(async ({ ctx, input }) => {
      return getTeamMembers(input.teamId);
    }),

    invite: protectedProcedure.input(z.object({
      teamId: z.number(),
      email: z.string().email(),
      role: z.enum(["admin", "member", "viewer"]).default("member"),
    })).mutation(async ({ ctx, input }) => {
      const inviteToken = nanoid(32);
      await addTeamMember({
        teamId: input.teamId,
        userId: ctx.user.id, // placeholder, will be updated on accept
        role: input.role,
        inviteEmail: input.email,
        inviteToken,
        status: "invited",
      });
      return { success: true, inviteToken };
    }),
  }),

  // ─── Templates ─────────────────────────────────────────────────────────────
  templates: router({
    list: publicProcedure.input(z.object({
      category: z.string().optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    })).query(async ({ input }) => {
      return getTemplates(input.category, input.limit, input.offset);
    }),

    get: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const tmpl = await getTemplateBySlug(input.slug);
      if (!tmpl) throw new TRPCError({ code: "NOT_FOUND" });
      return tmpl;
    }),

    myTemplates: protectedProcedure.query(async ({ ctx }) => {
      return getTemplatesByAuthor(ctx.user.id);
    }),

    publish: protectedProcedure.input(z.object({
      agentId: z.number(),
      name: z.string().min(1).max(256),
      description: z.string(),
      category: z.string(),
      tags: z.array(z.string()).default([]),
      priceCredits: z.number().min(0).default(0),
    })).mutation(async ({ ctx, input }) => {
      const agent = await getAgentById(input.agentId);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND" });
      if (agent.userId !== ctx.user.id) throw new TRPCError({ code: "FORBIDDEN" });

      const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${nanoid(6)}`;
      const agentConfig = {
        systemPrompt: agent.systemPrompt,
        modelId: agent.modelId,
        memoryEnabled: agent.memoryEnabled,
        webSearchEnabled: agent.webSearchEnabled,
        codeExecutionEnabled: agent.codeExecutionEnabled,
        fileUploadEnabled: agent.fileUploadEnabled,
        apiCallsEnabled: agent.apiCallsEnabled,
        temperature: agent.temperature,
        maxSteps: agent.maxSteps,
      };

      await createTemplate({
        authorId: ctx.user.id,
        name: input.name,
        slug,
        description: input.description,
        category: input.category,
        tags: input.tags,
        agentConfig,
        priceCredits: input.priceCredits,
        isApproved: false, // requires admin approval
      });

      return { success: true, slug };
    }),

    install: protectedProcedure.input(z.object({ templateSlug: z.string() })).mutation(async ({ ctx, input }) => {
      const tmpl = await getTemplateBySlug(input.templateSlug);
      if (!tmpl) throw new TRPCError({ code: "NOT_FOUND" });

      const config = tmpl.agentConfig as Record<string, unknown>;
      const slug = `${tmpl.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${nanoid(6)}`;

      await createAgent({
        userId: ctx.user.id,
        name: tmpl.name,
        description: tmpl.description ?? undefined,
        slug,
        systemPrompt: (config.systemPrompt as string) ?? "",
        modelId: (config.modelId as string) ?? "gpt-4o",
        memoryEnabled: (config.memoryEnabled as boolean) ?? false,
        webSearchEnabled: (config.webSearchEnabled as boolean) ?? false,
        codeExecutionEnabled: (config.codeExecutionEnabled as boolean) ?? false,
        fileUploadEnabled: (config.fileUploadEnabled as boolean) ?? false,
        apiCallsEnabled: (config.apiCallsEnabled as boolean) ?? false,
        temperature: (config.temperature as number) ?? 0.7,
        maxSteps: (config.maxSteps as number) ?? 10,
      });

      return { success: true, slug };
    }),
  }),

  // ─── Admin ─────────────────────────────────────────────────────────────────
  admin: router({
    stats: adminProcedure.query(async () => {
      return getSystemStats();
    }),

    users: adminProcedure.input(z.object({ limit: z.number().default(50), offset: z.number().default(0) })).query(async ({ input }) => {
      return getAllUsers(input.limit, input.offset);
    }),

    userCount: adminProcedure.query(async () => {
      return getUserCount();
    }),

    updateUserRole: adminProcedure.input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin"]),
    })).mutation(async ({ input }) => {
      const { updateAgent: _, ...db } = await import("./db");
      const { getDb } = await import("./db");
      const { users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await dbInstance.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      return { success: true };
    }),

    models: adminProcedure.query(async () => {
      return getModelPricing();
    }),

    updateModelPricing: adminProcedure.input(z.object({
      modelId: z.string(),
      displayName: z.string(),
      provider: z.enum(["openai", "anthropic", "manus", "custom"]),
      tier: z.enum(["standard", "premium", "ultra"]),
      creditsPerInputToken: z.number().positive(),
      creditsPerOutputToken: z.number().positive(),
      creditsPerToolCall: z.number().positive(),
      isActive: z.boolean().default(true),
      contextWindow: z.number().default(128000),
    })).mutation(async ({ input }) => {
      await upsertModelPricing(input);
      return { success: true };
    }),

    approveTemplate: adminProcedure.input(z.object({
      templateId: z.number(),
      approved: z.boolean(),
      featured: z.boolean().default(false),
    })).mutation(async ({ input }) => {
      const { getDb } = await import("./db");
      const { templates } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(templates).set({ isApproved: input.approved, isFeatured: input.featured }).where(eq(templates.id, input.templateId));
      return { success: true };
    }),

    seedData: adminProcedure.mutation(async () => {
      await seedDefaultData();
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
