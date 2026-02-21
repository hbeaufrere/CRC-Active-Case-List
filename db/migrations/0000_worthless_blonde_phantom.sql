CREATE TABLE `case_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`case_id` integer NOT NULL,
	`field_changed` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`changed_by` text NOT NULL,
	`changed_at` text DEFAULT (datetime('now')),
	`note` text,
	FOREIGN KEY (`case_id`) REFERENCES `cases`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`case_number` text NOT NULL,
	`category` text NOT NULL,
	`species` text NOT NULL,
	`common_name` text,
	`band_number` text,
	`active_problems` text NOT NULL,
	`current_treatments` text NOT NULL,
	`plan` text NOT NULL,
	`next_follow_up_date` text,
	`follow_up_notes` text,
	`status` text DEFAULT 'active' NOT NULL,
	`urgency` text DEFAULT 'moderate' NOT NULL,
	`intake_date` text,
	`intake_reason` text,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now')),
	`updated_by` text NOT NULL,
	`created_by` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cases_case_number_unique` ON `cases` (`case_number`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`initials` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `species` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`common_name` text NOT NULL,
	`scientific_name` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `species_common_name_unique` ON `species` (`common_name`);