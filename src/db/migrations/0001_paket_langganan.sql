CREATE TABLE `subscription_plan_features` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plan_version_id` int NOT NULL,
	`module_slug` varchar(100) NOT NULL,
	CONSTRAINT `subscription_plan_features_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plan_features_version_module_uq` UNIQUE(`plan_version_id`,`module_slug`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plan_versions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`plan_id` int NOT NULL,
	`version` int NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`changelog` text,
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`published_at` timestamp,
	CONSTRAINT `subscription_plan_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plan_versions_plan_version_uq` UNIQUE(`plan_id`,`version`)
);
--> statement-breakpoint
CREATE TABLE `subscription_plans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`status` enum('active','archived') NOT NULL DEFAULT 'active',
	`created_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `subscription_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_plans_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `village_plan_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`plan_version_id` int NOT NULL,
	`assigned_by` varchar(36),
	`assigned_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `village_plan_subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `village_plan_subscriptions_village_uq` UNIQUE(`village_id`)
);
--> statement-breakpoint
ALTER TABLE `subscription_plan_features` ADD CONSTRAINT `subscription_plan_features_version_fk` FOREIGN KEY (`plan_version_id`) REFERENCES `subscription_plan_versions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_plan_versions` ADD CONSTRAINT `subscription_plan_versions_plan_fk` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `village_plan_subscriptions` ADD CONSTRAINT `village_plan_subscriptions_village_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `village_plan_subscriptions` ADD CONSTRAINT `village_plan_subscriptions_version_fk` FOREIGN KEY (`plan_version_id`) REFERENCES `subscription_plan_versions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `subscription_plan_features_module_idx` ON `subscription_plan_features` (`module_slug`);--> statement-breakpoint
CREATE INDEX `subscription_plan_versions_plan_status_idx` ON `subscription_plan_versions` (`plan_id`,`status`);--> statement-breakpoint
CREATE INDEX `subscription_plans_status_idx` ON `subscription_plans` (`status`);--> statement-breakpoint
CREATE INDEX `village_plan_subscriptions_version_idx` ON `village_plan_subscriptions` (`plan_version_id`);
--> statement-breakpoint
INSERT INTO `subscription_plans` (`slug`, `name`, `status`) VALUES
  ('minimum', 'Minimum', 'active'),
  ('standar', 'Standar', 'active'),
  ('premium', 'Premium', 'active');
--> statement-breakpoint
INSERT INTO `subscription_plan_versions` (`plan_id`, `version`, `status`)
SELECT `id`, 1, 'draft'
FROM `subscription_plans`
WHERE `slug` IN ('minimum', 'standar', 'premium');