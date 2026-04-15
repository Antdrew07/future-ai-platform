CREATE TABLE `agents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`teamId` int,
	`slug` varchar(128) NOT NULL,
	`name` varchar(256) NOT NULL,
	`description` text,
	`avatar` text,
	`systemPrompt` text NOT NULL,
	`modelId` varchar(64) NOT NULL DEFAULT 'gpt-4o',
	`memoryEnabled` boolean NOT NULL DEFAULT false,
	`isPublic` boolean NOT NULL DEFAULT false,
	`isDeployed` boolean NOT NULL DEFAULT false,
	`webSearchEnabled` boolean NOT NULL DEFAULT false,
	`codeExecutionEnabled` boolean NOT NULL DEFAULT false,
	`fileUploadEnabled` boolean NOT NULL DEFAULT false,
	`apiCallsEnabled` boolean NOT NULL DEFAULT false,
	`maxSteps` int NOT NULL DEFAULT 10,
	`temperature` float NOT NULL DEFAULT 0.7,
	`customInstructions` text,
	`totalRuns` int NOT NULL DEFAULT 0,
	`totalCreditsUsed` bigint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`),
	CONSTRAINT `agents_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(128) NOT NULL,
	`keyHash` varchar(256) NOT NULL,
	`keyPrefix` varchar(16) NOT NULL,
	`lastUsedAt` timestamp,
	`expiresAt` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`totalCalls` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_keyHash_unique` UNIQUE(`keyHash`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`userId` int,
	`sessionId` varchar(128) NOT NULL,
	`title` varchar(512),
	`creditsUsed` bigint NOT NULL DEFAULT 0,
	`messageCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_packs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`credits` bigint NOT NULL,
	`priceUsd` float NOT NULL,
	`stripePriceId` varchar(256),
	`isPopular` boolean NOT NULL DEFAULT false,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_packs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('purchase','usage','refund','bonus','subscription') NOT NULL,
	`amount` bigint NOT NULL,
	`balanceAfter` bigint NOT NULL,
	`description` varchar(512),
	`taskId` int,
	`stripePaymentId` varchar(256),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` enum('user','assistant','system','tool') NOT NULL,
	`content` text NOT NULL,
	`toolName` varchar(64),
	`inputTokens` int NOT NULL DEFAULT 0,
	`outputTokens` int NOT NULL DEFAULT 0,
	`creditsUsed` float NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `model_pricing` (
	`id` int AUTO_INCREMENT NOT NULL,
	`modelId` varchar(64) NOT NULL,
	`displayName` varchar(128) NOT NULL,
	`provider` enum('openai','anthropic','manus','custom') NOT NULL,
	`tier` enum('standard','premium','ultra') NOT NULL DEFAULT 'standard',
	`creditsPerInputToken` float NOT NULL DEFAULT 0.001,
	`creditsPerOutputToken` float NOT NULL DEFAULT 0.002,
	`creditsPerToolCall` float NOT NULL DEFAULT 1,
	`isActive` boolean NOT NULL DEFAULT true,
	`contextWindow` int NOT NULL DEFAULT 128000,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `model_pricing_id` PRIMARY KEY(`id`),
	CONSTRAINT `model_pricing_modelId_unique` UNIQUE(`modelId`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`monthlyCredits` bigint NOT NULL,
	`priceUsd` float NOT NULL,
	`stripePriceId` varchar(256),
	`maxAgents` int NOT NULL DEFAULT 5,
	`maxTeamMembers` int NOT NULL DEFAULT 1,
	`features` json,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plans_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `task_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`taskId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`type` enum('thought','tool_call','tool_result','llm_response','error','final') NOT NULL,
	`content` text NOT NULL,
	`toolName` varchar(64),
	`toolInput` json,
	`toolOutput` json,
	`creditsUsed` float NOT NULL DEFAULT 0,
	`durationMs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `task_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`agentId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`input` text NOT NULL,
	`output` text,
	`status` enum('queued','running','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
	`creditsUsed` bigint NOT NULL DEFAULT 0,
	`inputTokens` int NOT NULL DEFAULT 0,
	`outputTokens` int NOT NULL DEFAULT 0,
	`toolCallCount` int NOT NULL DEFAULT 0,
	`stepCount` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`metadata` json,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('owner','admin','member','viewer') NOT NULL DEFAULT 'member',
	`inviteEmail` varchar(320),
	`inviteToken` varchar(128),
	`status` enum('active','invited','removed') NOT NULL DEFAULT 'invited',
	`joinedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`avatar` text,
	`creditBalance` bigint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`),
	CONSTRAINT `teams_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `template_installs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`userId` int NOT NULL,
	`agentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `template_installs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`name` varchar(256) NOT NULL,
	`slug` varchar(128) NOT NULL,
	`description` text,
	`longDescription` text,
	`category` varchar(64) NOT NULL,
	`tags` json,
	`agentConfig` json NOT NULL,
	`previewImage` text,
	`priceCredits` int NOT NULL DEFAULT 0,
	`installCount` int NOT NULL DEFAULT 0,
	`rating` float NOT NULL DEFAULT 0,
	`ratingCount` int NOT NULL DEFAULT 0,
	`isApproved` boolean NOT NULL DEFAULT false,
	`isFeatured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `templates_id` PRIMARY KEY(`id`),
	CONSTRAINT `templates_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `usage_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int,
	`date` varchar(10) NOT NULL,
	`taskCount` int NOT NULL DEFAULT 0,
	`messageCount` int NOT NULL DEFAULT 0,
	`inputTokens` bigint NOT NULL DEFAULT 0,
	`outputTokens` bigint NOT NULL DEFAULT 0,
	`creditsUsed` bigint NOT NULL DEFAULT 0,
	`toolCallCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usage_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` int NOT NULL,
	`stripeSubscriptionId` varchar(256),
	`stripeCustomerId` varchar(256),
	`status` enum('active','cancelled','past_due','trialing') NOT NULL DEFAULT 'active',
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_subscriptions_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatar` text;--> statement-breakpoint
ALTER TABLE `users` ADD `creditBalance` bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `apiQuota` int DEFAULT 100 NOT NULL;--> statement-breakpoint
CREATE INDEX `agent_user_idx` ON `agents` (`userId`);--> statement-breakpoint
CREATE INDEX `agent_slug_idx` ON `agents` (`slug`);--> statement-breakpoint
CREATE INDEX `apikey_user_idx` ON `api_keys` (`userId`);--> statement-breakpoint
CREATE INDEX `apikey_hash_idx` ON `api_keys` (`keyHash`);--> statement-breakpoint
CREATE INDEX `conv_agent_idx` ON `conversations` (`agentId`);--> statement-breakpoint
CREATE INDEX `conv_session_idx` ON `conversations` (`sessionId`);--> statement-breakpoint
CREATE INDEX `txn_user_idx` ON `credit_transactions` (`userId`);--> statement-breakpoint
CREATE INDEX `msg_conv_idx` ON `messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `step_task_idx` ON `task_steps` (`taskId`);--> statement-breakpoint
CREATE INDEX `task_agent_idx` ON `tasks` (`agentId`);--> statement-breakpoint
CREATE INDEX `task_user_idx` ON `tasks` (`userId`);--> statement-breakpoint
CREATE INDEX `task_status_idx` ON `tasks` (`status`);--> statement-breakpoint
CREATE INDEX `member_team_idx` ON `team_members` (`teamId`);--> statement-breakpoint
CREATE INDEX `member_user_idx` ON `team_members` (`userId`);--> statement-breakpoint
CREATE INDEX `tmpl_author_idx` ON `templates` (`authorId`);--> statement-breakpoint
CREATE INDEX `tmpl_category_idx` ON `templates` (`category`);--> statement-breakpoint
CREATE INDEX `analytics_user_date_idx` ON `usage_analytics` (`userId`,`date`);