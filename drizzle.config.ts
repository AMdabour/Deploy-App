import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/db.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/scheduling_app',
  },
  verbose: true,
  strict: true,
});