import {
  foreignKey,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import { villages } from "./village";

export const SUBSCRIPTION_PLAN_STATUSES = ["active", "archived"] as const;
export const SUBSCRIPTION_PLAN_VERSION_STATUSES = ["draft", "published", "archived"] as const;

/** Identitas paket yang stabil; perubahan fitur selalu dibuat sebagai versi baru. */
export const subscriptionPlans = mysqlTable(
  "subscription_plans",
  {
    id: int("id").autoincrement().primaryKey(),
    slug: varchar("slug", { length: 50 }).notNull(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", SUBSCRIPTION_PLAN_STATUSES).notNull().default("active"),
    createdBy: varchar("created_by", { length: 36 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("subscription_plans_slug_uq").on(table.slug),
    index("subscription_plans_status_idx").on(table.status),
  ],
);

/** Versi immutable setelah diterbitkan; tenant menunjuk ke versi tertentu. */
export const subscriptionPlanVersions = mysqlTable(
  "subscription_plan_versions",
  {
    id: int("id").autoincrement().primaryKey(),
    planId: int("plan_id").notNull(),
    version: int("version").notNull(),
    status: mysqlEnum("status", SUBSCRIPTION_PLAN_VERSION_STATUSES).notNull().default("draft"),
    changelog: text("changelog"),
    createdBy: varchar("created_by", { length: 36 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    publishedAt: timestamp("published_at"),
  },
  (table) => [
    // Nama FK default Drizzle melebihi batas 64 karakter MySQL, jadi
    // dideklarasikan eksplisit seperti tabel lain di schema ini.
    foreignKey({
      name: "subscription_plan_versions_plan_fk",
      columns: [table.planId],
      foreignColumns: [subscriptionPlans.id],
    }).onDelete("cascade"),
    uniqueIndex("subscription_plan_versions_plan_version_uq").on(table.planId, table.version),
    index("subscription_plan_versions_plan_status_idx").on(table.planId, table.status),
  ],
);

/** Slug modul yang boleh dipakai tenant pada satu versi paket. */
export const subscriptionPlanFeatures = mysqlTable(
  "subscription_plan_features",
  {
    id: int("id").autoincrement().primaryKey(),
    planVersionId: int("plan_version_id").notNull(),
    moduleSlug: varchar("module_slug", { length: 100 }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "subscription_plan_features_version_fk",
      columns: [table.planVersionId],
      foreignColumns: [subscriptionPlanVersions.id],
    }).onDelete("cascade"),
    uniqueIndex("subscription_plan_features_version_module_uq").on(
      table.planVersionId,
      table.moduleSlug,
    ),
    index("subscription_plan_features_module_idx").on(table.moduleSlug),
  ],
);

/** Versi paket aktif untuk satu tenant; tidak ada baris berarti tenant legacy. */
export const villagePlanSubscriptions = mysqlTable(
  "village_plan_subscriptions",
  {
    id: int("id").autoincrement().primaryKey(),
    villageId: int("village_id").notNull(),
    planVersionId: int("plan_version_id").notNull(),
    assignedBy: varchar("assigned_by", { length: 36 }),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    foreignKey({
      name: "village_plan_subscriptions_village_fk",
      columns: [table.villageId],
      foreignColumns: [villages.id],
    }).onDelete("cascade"),
    foreignKey({
      name: "village_plan_subscriptions_version_fk",
      columns: [table.planVersionId],
      foreignColumns: [subscriptionPlanVersions.id],
    }).onDelete("restrict"),
    uniqueIndex("village_plan_subscriptions_village_uq").on(table.villageId),
    index("village_plan_subscriptions_version_idx").on(table.planVersionId),
  ],
);

