ALTER TABLE "daily_tasks" DROP CONSTRAINT "daily_tasks_objective_id_monthly_objectives_id_fk";
--> statement-breakpoint
ALTER TABLE "daily_tasks" DROP CONSTRAINT "daily_tasks_goal_id_goals_id_fk";
--> statement-breakpoint
ALTER TABLE "daily_tasks" ADD CONSTRAINT "daily_tasks_objective_id_monthly_objectives_id_fk" FOREIGN KEY ("objective_id") REFERENCES "public"."monthly_objectives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_tasks" ADD CONSTRAINT "daily_tasks_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE cascade ON UPDATE no action;