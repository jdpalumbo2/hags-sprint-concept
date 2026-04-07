CREATE TYPE "public"."business_type" AS ENUM('product', 'service', 'app', 'website', 'marketplace', 'other');--> statement-breakpoint
CREATE TYPE "public"."current_stage" AS ENUM('idea', 'mockup', 'prototype', 'landing_page_live', 'has_signups', 'other');--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_name" text NOT NULL,
	"passcode_hash" text NOT NULL,
	"business_type" "business_type" NOT NULL,
	"business_description" text NOT NULL,
	"target_customer" text NOT NULL,
	"current_stage" "current_stage" NOT NULL,
	"available_tools" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_team_name_unique" UNIQUE("team_name")
);
