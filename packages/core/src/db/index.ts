import { AsyncLocalStorage } from "node:async_hooks";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import {
  type NeonDatabase,
  type NeonQueryResultHKT,
  drizzle,
} from "drizzle-orm/neon-serverless";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { Resource } from "sst";
import * as schema from "./schema";
import { Pool } from "@neondatabase/serverless";

if (typeof WebSocket === "undefined") {
  const { neonConfig } = await import("@neondatabase/serverless");
  const { WebSocket } = await import("ws");
  neonConfig.webSocketConstructor = WebSocket;
}

export const pool = new Pool({
  connectionString: Resource.Neon.connectionUriPooler,
});
export const db = drizzle(pool, {
  schema,
});

type Database = NeonDatabase<typeof schema>;
type DatabaseTransaction = PgTransaction<
  NeonQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

const transactionContext = new AsyncLocalStorage<DatabaseTransaction>();

export function useTransaction<T>(
  fn: (tx: Database | DatabaseTransaction) => T,
) {
  const tx = transactionContext.getStore();
  return fn(tx ?? db);
}

export function createTransaction<T>(
  fn: (tx: DatabaseTransaction) => Promise<T>,
) {
  const tx = transactionContext.getStore();
  if (tx) {
    return fn(tx);
  }
  return db.transaction((tx) => transactionContext.run(tx, fn, tx));
}

export { schema };

export * from "drizzle-orm";
