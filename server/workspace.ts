/**
 * Future AI Platform — Workspace Service
 *
 * Handles all workspace (multi-tenancy) operations:
 *  - Creating personal workspaces on user registration
 *  - Creating team workspaces
 *  - Resolving which workspace a user is acting in
 *  - Enforcing workspace membership for resource access
 *
 * Every agent, task, and conversation belongs to a workspace.
 * A personal workspace is auto-created for every new user.
 */

import { eq, and, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  workspaces,
  workspaceMembers,
  agents,
  tasks,
  type Workspace,
  type WorkspaceMember,
} from "../drizzle/schema";
import { nanoid } from "nanoid";

// ─── Workspace Creation ───────────────────────────────────────────────────────

/**
 * Create a personal workspace for a new user.
 * Called automatically during user registration.
 */
export async function createPersonalWorkspace(userId: number, userName: string): Promise<Workspace> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const slug = `personal-${userId}-${nanoid(8)}`;
  await db.insert(workspaces).values({
    ownerId: userId,
    name: `${userName}'s Workspace`,
    slug,
    plan: "free",
    creditBalance: 0,
    maxAgents: 5,
    maxMembersPerTeam: 1,
  });

  const ws = await db.select().from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);

  if (!ws[0]) throw new Error("Failed to create personal workspace");

  // Add owner as member
  await db.insert(workspaceMembers).values({
    workspaceId: ws[0].id,
    userId,
    role: "owner",
    status: "active",
    joinedAt: new Date(),
  });

  return ws[0];
}

/**
 * Create a team workspace.
 */
export async function createTeamWorkspace(
  ownerId: number,
  name: string,
  teamId: number,
): Promise<Workspace> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const slug = `team-${teamId}-${nanoid(8)}`;
  await db.insert(workspaces).values({
    ownerId,
    teamId,
    name,
    slug,
    plan: "free",
    creditBalance: 0,
    maxAgents: 20,
    maxMembersPerTeam: 10,
  });

  const ws = await db.select().from(workspaces)
    .where(eq(workspaces.slug, slug))
    .limit(1);

  if (!ws[0]) throw new Error("Failed to create team workspace");

  await db.insert(workspaceMembers).values({
    workspaceId: ws[0].id,
    userId: ownerId,
    role: "owner",
    status: "active",
    joinedAt: new Date(),
  });

  return ws[0];
}

// ─── Workspace Lookup ─────────────────────────────────────────────────────────

/**
 * Get the personal workspace for a user (auto-creates if missing).
 */
export async function getOrCreatePersonalWorkspace(userId: number, userName = "User"): Promise<Workspace> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Find personal workspace (no teamId, owned by this user)
  const existing = await db.select().from(workspaces)
    .where(and(eq(workspaces.ownerId, userId)))
    .limit(1);

  if (existing[0]) return existing[0];

  // Auto-create on first access
  return createPersonalWorkspace(userId, userName);
}

/**
 * Get all workspaces a user is a member of.
 */
export async function getWorkspacesForUser(userId: number): Promise<Workspace[]> {
  const db = await getDb();
  if (!db) return [];

  const memberships = await db.select({ workspaceId: workspaceMembers.workspaceId })
    .from(workspaceMembers)
    .where(and(
      eq(workspaceMembers.userId, userId),
      eq(workspaceMembers.status, "active"),
    ));

  if (memberships.length === 0) return [];

  const wsIds = memberships.map(m => m.workspaceId);
  return db.select().from(workspaces).where(inArray(workspaces.id, wsIds));
}

/**
 * Get a workspace by ID, verifying the user is a member.
 * Returns null if user is not a member.
 */
export async function getWorkspaceForUser(
  workspaceId: number,
  userId: number,
): Promise<{ workspace: Workspace; member: WorkspaceMember } | null> {
  const db = await getDb();
  if (!db) return null;

  const ws = await db.select().from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);

  if (!ws[0]) return null;

  const member = await db.select().from(workspaceMembers)
    .where(and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, userId),
      eq(workspaceMembers.status, "active"),
    ))
    .limit(1);

  if (!member[0]) return null;

  return { workspace: ws[0], member: member[0] };
}

// ─── Authorization Helpers ────────────────────────────────────────────────────

/**
 * Check if a user can access an agent.
 * A user can access an agent if:
 *  1. They own the agent directly (userId match), OR
 *  2. They are an active member of the workspace the agent belongs to
 */
export async function canUserAccessAgent(
  userId: number,
  agentId: number,
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const agent = await db.select({
    userId: agents.userId,
    workspaceId: agents.workspaceId,
  }).from(agents).where(eq(agents.id, agentId)).limit(1);

  if (!agent[0]) return false;

  // Direct owner
  if (agent[0].userId === userId) return true;

  // Workspace member
  const membership = await db.select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(and(
      eq(workspaceMembers.workspaceId, agent[0].workspaceId),
      eq(workspaceMembers.userId, userId),
      eq(workspaceMembers.status, "active"),
    ))
    .limit(1);

  return !!membership[0];
}

/**
 * Check if a user can access a task.
 */
export async function canUserAccessTask(
  userId: number,
  taskId: number,
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const task = await db.select({
    userId: tasks.userId,
    workspaceId: tasks.workspaceId,
  }).from(tasks).where(eq(tasks.id, taskId)).limit(1);

  if (!task[0]) return false;

  // Direct owner
  if (task[0].userId === userId) return true;

  // Workspace member (if task has a workspace)
  if (task[0].workspaceId) {
    const membership = await db.select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, task[0].workspaceId),
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.status, "active"),
      ))
      .limit(1);

    if (membership[0]) return true;
  }

  return false;
}

// ─── Workspace Member Management ─────────────────────────────────────────────

export async function addWorkspaceMember(
  workspaceId: number,
  userId: number,
  role: "admin" | "member" | "viewer",
  inviteEmail?: string,
  inviteToken?: string,
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(workspaceMembers).values({
    workspaceId,
    userId,
    role,
    inviteEmail,
    inviteToken,
    status: inviteToken ? "invited" : "active",
    joinedAt: inviteToken ? undefined : new Date(),
  });
}

export async function acceptWorkspaceInvite(
  inviteToken: string,
  userId: number,
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const invite = await db.select().from(workspaceMembers)
    .where(and(
      eq(workspaceMembers.inviteToken, inviteToken),
      eq(workspaceMembers.status, "invited"),
    ))
    .limit(1);

  if (!invite[0]) return false;

  await db.update(workspaceMembers)
    .set({ userId, status: "active", joinedAt: new Date(), inviteToken: null })
    .where(eq(workspaceMembers.id, invite[0].id));

  return true;
}

export async function getWorkspaceMembers(workspaceId: number): Promise<WorkspaceMember[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(workspaceMembers)
    .where(eq(workspaceMembers.workspaceId, workspaceId));
}
