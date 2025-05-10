import { drizzle } from "drizzle-orm/neon-serverless";
import { Resource } from "sst";
import * as schema from "./schema";

if (typeof WebSocket === "undefined") {
  const { neonConfig } = await import("@neondatabase/serverless");
  const { WebSocket } = await import("ws");
  neonConfig.webSocketConstructor = WebSocket;
}

export const db = drizzle(Resource.Neon.connectionUriPooler, {
  schema,
});

export { schema };

export * from "drizzle-orm";
