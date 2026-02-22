CREATE TABLE `necropsies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`date_died` text NOT NULL,
	`vmth_id` text NOT NULL,
	`wrmd_id` text,
	`species` text NOT NULL,
	`clinical_problems` text NOT NULL,
	`results` text,
	`is_final` integer DEFAULT false,
	`necropsy_link` text,
	`created_by` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	`updated_by` text NOT NULL,
	`updated_at` text DEFAULT (datetime('now'))
);
