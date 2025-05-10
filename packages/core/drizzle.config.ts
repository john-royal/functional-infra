import { defineConfig } from "drizzle-kit";
import { Resource } from "sst";

export default defineConfig({
  dialect: "postgresql",
  schema: "src/db/schema",
  dbCredentials: {
    url: Resource.Neon.connectionUri,
  },
});
