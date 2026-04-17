CREATE TABLE `browser_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskId` int,
	`browserbaseSessionId` varchar(256) NOT NULL,
	`status` enum('active','completed','failed','timeout') NOT NULL DEFAULT 'active',
	`startUrl` text,
	`creditsUsed` int NOT NULL DEFAULT 0,
	`durationSeconds` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `browser_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `browser_sessions_browserbaseSessionId_unique` UNIQUE(`browserbaseSessionId`)
);
--> statement-breakpoint
CREATE TABLE `domain_purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`domain` varchar(256) NOT NULL,
	`tld` varchar(32) NOT NULL,
	`registrar` enum('namecheap','godaddy') NOT NULL DEFAULT 'namecheap',
	`registrarOrderId` varchar(256),
	`stripePaymentId` varchar(256),
	`priceCharged` float NOT NULL,
	`costToUs` float NOT NULL,
	`status` enum('pending','active','expired','failed') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp,
	`autoRenew` boolean NOT NULL DEFAULT true,
	`dnsConfigured` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `domain_purchases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `browser_user_idx` ON `browser_sessions` (`userId`);--> statement-breakpoint
CREATE INDEX `browser_task_idx` ON `browser_sessions` (`taskId`);--> statement-breakpoint
CREATE INDEX `domain_user_idx` ON `domain_purchases` (`userId`);--> statement-breakpoint
CREATE INDEX `domain_name_idx` ON `domain_purchases` (`domain`);