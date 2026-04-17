CREATE TABLE `scheduled_tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`agentId` int NOT NULL,
	`title` varchar(512) NOT NULL,
	`prompt` text NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`status` enum('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending',
	`taskId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `uploaded_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskId` int,
	`filename` varchar(512) NOT NULL,
	`mimeType` varchar(128) NOT NULL,
	`sizeBytes` int NOT NULL,
	`s3Key` varchar(512) NOT NULL,
	`url` text NOT NULL,
	`extractedText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `uploaded_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `sched_user_idx` ON `scheduled_tasks` (`userId`);--> statement-breakpoint
CREATE INDEX `sched_status_idx` ON `scheduled_tasks` (`status`);--> statement-breakpoint
CREATE INDEX `sched_time_idx` ON `scheduled_tasks` (`scheduledFor`);--> statement-breakpoint
CREATE INDEX `upload_user_idx` ON `uploaded_files` (`userId`);