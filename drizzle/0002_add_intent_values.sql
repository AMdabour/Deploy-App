-- Add missing intent enum values
ALTER TYPE "public"."intent" ADD VALUE 'create_goal';
ALTER TYPE "public"."intent" ADD VALUE 'create_objective'; 
ALTER TYPE "public"."intent" ADD VALUE 'create_roadmap';