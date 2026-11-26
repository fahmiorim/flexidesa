-- ===== 0006_rbac_batas_tenant_dan_slug_global.sql =====
-- Dua aturan yang tidak dapat dinyatakan sebagai unique index biasa:
--
-- 1. `role_permissions` boleh menautkan role & modul bila keduanya milik tenant
--    yang sama, atau salah satunya global (`village_id IS NULL`). Kombinasi dua
--    tenant berbeda ditolak database, bukan hanya repository.
-- 2. Slug role/modul global (`village_id IS NULL`) wajib unik. Unique index
--    `(village_id, slug)` tidak menegakkan ini karena MySQL/MariaDB menganggap
--    NULL berbeda satu sama lain.
--
-- Keputusan produk: entity global boleh dipakai tenant mana pun (template
-- memberi grant modul global ke role desa), sedangkan dua entity desa berbeda
-- tidak boleh bertemu dalam satu grant.
CREATE TRIGGER role_permissions_tenant_bi BEFORE INSERT ON role_permissions
FOR EACH ROW
BEGIN
  DECLARE role_village INT DEFAULT NULL;
  DECLARE module_village INT DEFAULT NULL;
  SELECT village_id INTO role_village FROM roles WHERE id = NEW.role_id;
  SELECT village_id INTO module_village FROM modules WHERE id = NEW.module_id;
  IF role_village IS NOT NULL AND module_village IS NOT NULL
     AND role_village <> module_village THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Modul tidak sesuai tenant role.';
  END IF;
END;
--> statement-breakpoint
CREATE TRIGGER role_permissions_tenant_bu BEFORE UPDATE ON role_permissions
FOR EACH ROW
BEGIN
  DECLARE role_village INT DEFAULT NULL;
  DECLARE module_village INT DEFAULT NULL;
  SELECT village_id INTO role_village FROM roles WHERE id = NEW.role_id;
  SELECT village_id INTO module_village FROM modules WHERE id = NEW.module_id;
  IF role_village IS NOT NULL AND module_village IS NOT NULL
     AND role_village <> module_village THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Modul tidak sesuai tenant role.';
  END IF;
END;
--> statement-breakpoint
CREATE TRIGGER roles_global_slug_bi BEFORE INSERT ON roles
FOR EACH ROW
BEGIN
  IF NEW.village_id IS NULL
     AND EXISTS (SELECT 1 FROM roles WHERE village_id IS NULL AND slug = NEW.slug) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slug role global sudah dipakai.';
  END IF;
END;
--> statement-breakpoint
CREATE TRIGGER roles_global_slug_bu BEFORE UPDATE ON roles
FOR EACH ROW
BEGIN
  IF NEW.village_id IS NULL
     AND EXISTS (
       SELECT 1 FROM roles
       WHERE village_id IS NULL AND slug = NEW.slug AND id <> NEW.id
     ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slug role global sudah dipakai.';
  END IF;
END;
--> statement-breakpoint
CREATE TRIGGER modules_global_slug_bi BEFORE INSERT ON modules
FOR EACH ROW
BEGIN
  IF NEW.village_id IS NULL
     AND EXISTS (SELECT 1 FROM modules WHERE village_id IS NULL AND slug = NEW.slug) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slug modul global sudah dipakai.';
  END IF;
END;
--> statement-breakpoint
CREATE TRIGGER modules_global_slug_bu BEFORE UPDATE ON modules
FOR EACH ROW
BEGIN
  IF NEW.village_id IS NULL
     AND EXISTS (
       SELECT 1 FROM modules
       WHERE village_id IS NULL AND slug = NEW.slug AND id <> NEW.id
     ) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Slug modul global sudah dipakai.';
  END IF;
END;
