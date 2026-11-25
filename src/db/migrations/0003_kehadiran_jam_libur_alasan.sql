CREATE TABLE `kehadiran_alasan_keluar` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`alasan` varchar(255) NOT NULL,
	`keterangan` text,
	`created_by` varchar(36),
	`updated_by` varchar(36),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kehadiran_alasan_keluar_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kehadiran_hari_libur` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`tanggal` date NOT NULL,
	`keterangan` text,
	CONSTRAINT `kehadiran_hari_libur_id` PRIMARY KEY(`id`),
	CONSTRAINT `kehadiran_hari_libur_village_tanggal_uq` UNIQUE(`village_id`,`tanggal`)
);
--> statement-breakpoint
CREATE TABLE `kehadiran_jam_kerja` (
	`id` int AUTO_INCREMENT NOT NULL,
	`village_id` int NOT NULL,
	`nama_hari` varchar(65) NOT NULL,
	`jam_masuk` time NOT NULL,
	`jam_keluar` time NOT NULL,
	`status` boolean NOT NULL DEFAULT true,
	`keterangan` text,
	CONSTRAINT `kehadiran_jam_kerja_id` PRIMARY KEY(`id`),
	CONSTRAINT `kehadiran_jam_kerja_village_hari_uq` UNIQUE(`village_id`,`nama_hari`)
);
--> statement-breakpoint
ALTER TABLE `kehadiran_alasan_keluar` ADD CONSTRAINT `kehadiran_alasan_keluar_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kehadiran_hari_libur` ADD CONSTRAINT `kehadiran_hari_libur_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kehadiran_jam_kerja` ADD CONSTRAINT `kehadiran_jam_kerja_village_id_villages_id_fk` FOREIGN KEY (`village_id`) REFERENCES `villages`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `kehadiran_alasan_keluar_village_idx` ON `kehadiran_alasan_keluar` (`village_id`);