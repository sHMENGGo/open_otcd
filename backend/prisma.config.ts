import { config } from "dotenv";
import { resolve } from "path";
import { defineConfig, env } from "prisma/config";

// Navigate up one level from /backend to reach the root .env
config({ path: resolve(__dirname, "../.env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});