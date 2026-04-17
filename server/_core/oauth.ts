import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";
import { nanoid } from "nanoid";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      // Check if this is a new user (no existing record)
      const existingUser = await db.getUserByOpenId(userInfo.openId);

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      // Provision default agent + credits for brand-new users
      if (!existingUser) {
        const newUser = await db.getUserByOpenId(userInfo.openId);
        if (newUser) {
          // Grant 100 free starter credits
          await db.addCredits(newUser.id, 100, "bonus", "Welcome gift — 100 free credits to get you started");

          // Create a default fully-capable agent
          await db.createAgent({
            userId: newUser.id,
            name: "Future AI",
            description: "Your personal AI assistant — ready to build, research, write, and create anything you need.",
            slug: `future-ai-${nanoid(8)}`,
            systemPrompt: "",
            modelId: "gpt-4o",
            webSearchEnabled: true,
            codeExecutionEnabled: true,
            fileUploadEnabled: true,
            apiCallsEnabled: true,
            memoryEnabled: false,
            maxSteps: 15,
            temperature: 0.7,
          });
        }
      }

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
