import type { Config } from "drizzle-kit";

export default {
  schema: "./packages/db/src/schema/*.ts",
  out: "./packages/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./data/verdicta.sqlite"
  }
} satisfies Config;
