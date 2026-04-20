-- ─── Migration: Add Multi-Tenancy Workspace Tables ───────────────────────────
-- This migration adds the workspace layer that makes the platform truly
-- multi-tenant. Every agent, task, and conversation is now scoped to a
-- workspace, enabling real team collaboration and resource isolation.
--
-- Run with: pnpm drizzle-kit push  (or apply manually)
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the workspaces table (the multi-tenancy root)
CREATE TABLE IF NOT EXISTS `workspaces` (
  `id` int AUTO_INCREMENT NOT NULL,
  `ownerId` int NOT NULL,
  `teamId` int,
  `name` varchar(256) NOT NULL,
  `slug` varchar(128) NOT NULL,
  `plan` enum('free','starter','pro','enterprise') NOT NULL DEFAULT 'free',
  `creditBalance` bigint NOT NULL DEFAULT 0,
  `maxAgents` int NOT NULL DEFAULT 5,
  `maxMembersPerTeam` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
  CONSTRAINT `workspaces_slug_unique` UNIQUE(`slug`)
);

CREATE INDEX `ws_owner_idx` ON `workspaces` (`ownerId`);
CREATE INDEX `ws_slug_idx` ON `workspaces` (`slug`);

-- 2. Create the workspace_members table
CREATE TABLE IF NOT EXISTS `workspace_members` (
  `id` int AUTO_INCREMENT NOT NULL,
  `workspaceId` int NOT NULL,
  `userId` int NOT NULL,
  `role` enum('owner','admin','member','viewer') NOT NULL DEFAULT 'member',
  `inviteEmail` varchar(320),
  `inviteToken` varchar(128),
  `status` enum('active','invited','removed') NOT NULL DEFAULT 'invited',
  `joinedAt` timestamp,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `workspace_members_id` PRIMARY KEY(`id`)
);

CREATE INDEX `wsmember_ws_idx` ON `workspace_members` (`workspaceId`);
CREATE INDEX `wsmember_user_idx` ON `workspace_members` (`userId`);

-- 3. Add workspaceId to agents table
ALTER TABLE `agents`
  ADD COLUMN IF NOT EXISTS `workspaceId` int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS `agent_ws_idx` ON `agents` (`workspaceId`);

-- 4. Add workspaceId to tasks table
ALTER TABLE `tasks`
  ADD COLUMN IF NOT EXISTS `workspaceId` int;

CREATE INDEX IF NOT EXISTS `task_ws_idx` ON `tasks` (`workspaceId`);

-- 5. Backfill: Create a personal workspace for every existing user
-- (This is a safe no-op if the table was just created)
INSERT INTO `workspaces` (`ownerId`, `name`, `slug`, `plan`, `creditBalance`, `maxAgents`, `maxMembersPerTeam`)
SELECT
  u.`id`,
  CONCAT(COALESCE(u.`name`, 'User'), '''s Workspace'),
  CONCAT('personal-', u.`id`, '-backfill'),
  'free',
  0,
  5,
  1
FROM `users` u
WHERE NOT EXISTS (
  SELECT 1 FROM `workspaces` w WHERE w.`ownerId` = u.`id`
);

-- 6. Add each user as the owner of their personal workspace
INSERT INTO `workspace_members` (`workspaceId`, `userId`, `role`, `status`, `joinedAt`)
SELECT w.`id`, w.`ownerId`, 'owner', 'active', NOW()
FROM `workspaces` w
WHERE NOT EXISTS (
  SELECT 1 FROM `workspace_members` wm
  WHERE wm.`workspaceId` = w.`id` AND wm.`userId` = w.`ownerId`
);

-- 7. Backfill workspaceId on existing agents
UPDATE `agents` a
JOIN `workspaces` w ON w.`ownerId` = a.`userId`
SET a.`workspaceId` = w.`id`
WHERE a.`workspaceId` = 0;
