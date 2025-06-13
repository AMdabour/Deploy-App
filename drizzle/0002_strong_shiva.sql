ALTER TYPE "public"."insight_type" ADD VALUE 'conversational_interaction';--> statement-breakpoint
ALTER TYPE "public"."insight_type" ADD VALUE 'text_command_usage';--> statement-breakpoint
ALTER TYPE "public"."insight_type" ADD VALUE 'Voice_command';--> statement-breakpoint
ALTER TYPE "public"."intent" ADD VALUE 'create_goal' BEFORE 'ask_question';--> statement-breakpoint
ALTER TYPE "public"."intent" ADD VALUE 'create_objective' BEFORE 'ask_question';--> statement-breakpoint
ALTER TYPE "public"."intent" ADD VALUE 'create_roadmap' BEFORE 'ask_question';