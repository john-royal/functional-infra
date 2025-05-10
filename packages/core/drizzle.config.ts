import { defineConfig } from "drizzle-kit";
import { Resource } from "sst";

export default defineConfig({
  dialect: "postgresql",
  schema: "src/**/*.sql.ts",
  dbCredentials: {
    url: Resource.Neon.connectionUri,
  },
});
