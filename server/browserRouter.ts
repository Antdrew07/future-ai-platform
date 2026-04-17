import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { browserSessions } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

const BB_API = "https://www.browserbase.com/v1";
const BB_KEY = process.env.BROWSERBASE_API_KEY ?? "";
const BB_PROJECT = process.env.BROWSERBASE_PROJECT_ID ?? "";

// ─── Browserbase API helpers ──────────────────────────────────────────────────

async function bbRequest(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BB_API}${path}`, {
    method,
    headers: {
      "x-bb-api-key": BB_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Browserbase API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Browser Router ───────────────────────────────────────────────────────────

export const browserRouter = router({
  // Create a new browser session
  createSession: protectedProcedure
    .input(z.object({
      startUrl: z.string().url().optional(),
      taskId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Create session on Browserbase
      const session = await bbRequest("POST", "/sessions", {
        projectId: BB_PROJECT,
        browserSettings: {
          viewport: { width: 1280, height: 800 },
          blockAds: true,
        },
        timeout: 900, // 15 minutes
      }) as { id: string; status: string; debuggerUrl?: string; liveViewUrl?: string };

      // Save to DB
      const dbConn = await getDb();
      if (dbConn) {
        await dbConn.insert(browserSessions).values({
          userId: ctx.user.id,
          taskId: input.taskId,
          browserbaseSessionId: session.id,
          status: "active",
          startUrl: input.startUrl,
          creditsUsed: 10, // 10 credits per browser session
        });
      }

      // Deduct credits
      // (handled by the agent task credit system)

      return {
        sessionId: session.id,
        liveViewUrl: session.liveViewUrl ?? `https://www.browserbase.com/sessions/${session.id}`,
        debuggerUrl: session.debuggerUrl,
        status: session.status,
      };
    }),

  // Get session status and live view URL
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const session = await bbRequest("GET", `/sessions/${input.sessionId}`) as {
        id: string;
        status: string;
        liveViewUrl?: string;
        debuggerUrl?: string;
      };

      return {
        sessionId: session.id,
        status: session.status,
        liveViewUrl: session.liveViewUrl ?? `https://www.browserbase.com/sessions/${session.id}`,
        debuggerUrl: session.debuggerUrl,
      };
    }),

  // Stop a browser session
  stopSession: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      try {
        await bbRequest("DELETE", `/sessions/${input.sessionId}`);
      } catch {
        // Session may already be stopped
      }

      const dbConn = await getDb();
      if (dbConn) {
        await dbConn.update(browserSessions)
          .set({ status: "completed", completedAt: new Date() })
          .where(eq(browserSessions.browserbaseSessionId, input.sessionId));
      }

      return { success: true };
    }),

  // List user's browser sessions
  listSessions: protectedProcedure
    .query(async ({ ctx }) => {
      const dbConn = await getDb();
      if (!dbConn) return [];
      const sessions = await dbConn.select()
        .from(browserSessions)
        .where(eq(browserSessions.userId, ctx.user.id))
        .orderBy(desc(browserSessions.createdAt))
        .limit(20);
      return sessions;
    }),

  // Check if Browserbase is configured and available
  isAvailable: protectedProcedure
    .query(async () => {
      return {
        available: !!(BB_KEY && BB_PROJECT),
        projectId: BB_PROJECT ? BB_PROJECT.substring(0, 8) + "..." : null,
      };
    }),
});
