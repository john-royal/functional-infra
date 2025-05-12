import { Pool } from "@neondatabase/serverless";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import {
  type NeonDatabase,
  type NeonQueryResultHKT,
  drizzle,
} from "drizzle-orm/neon-serverless";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { Resource } from "sst";
import { createContext } from "../context";
import * as schema from "./schema";

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

const transactionContext = createContext<DatabaseTransaction>();

export function useTransaction<T>(
  fn: (tx: Database | DatabaseTransaction) => T,
) {
  const tx = transactionContext.use();
  return fn(tx ?? db);
}

export function createTransaction<T>(
  fn: (tx: DatabaseTransaction) => Promise<T>,
) {
  const tx = transactionContext.use();
  if (tx) {
    return fn(tx);
  }
  return db.transaction((tx) => transactionContext.provide(tx, fn, tx));
}

export { schema };

export * from "drizzle-orm";
