import {
  pgTable,
  uuid,
  text,
  timestamp,
  pgEnum,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

export const businessTypeEnum = pgEnum("business_type", [
  "product",
  "service",
  "app",
  "website",
  "marketplace",
  "other",
]);

export const currentStageEnum = pgEnum("current_stage", [
  "idea",
  "mockup",
  "prototype",
  "landing_page_live",
  "has_signups",
  "other",
]);

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamName: text("team_name").notNull().unique(),
  passcodeHash: text("passcode_hash").notNull(),
  businessType: businessTypeEnum("business_type").notNull(),
  businessDescription: text("business_description").notNull(),
  targetCustomer: text("target_customer").notNull(),
  currentStage: currentStageEnum("current_stage").notNull(),
  availableTools: text("available_tools").array().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export const sprints = pgTable("sprints", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  personCount: integer("person_count").notNull(),
  learningQuestion: text("learning_question").notNull(),
  testType: text("test_type").notNull(),
  planJson: jsonb("plan_json").notNull(),
  status: text("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Sprint = typeof sprints.$inferSelect;
export type NewSprint = typeof sprints.$inferInsert;
