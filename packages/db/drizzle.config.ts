import { defineConfig } from "drizzle-kit";
import path from "path";

const databaseUrl = process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/aerisyn";

export default defineConfig({
  schema: "./src/schema",
  out: path.join(__dirname, "../../database/migrations"),
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
