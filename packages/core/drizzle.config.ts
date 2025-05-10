import { defineConfig } from "drizzle-kit";
import { Resource } from "sst";

export default defineConfig({
  dialect: "postgresql",
  schema: "src/db/schema/index.ts",
  dbCredentials: {
    url: Resource.Neon.connectionUri,
  },
});
