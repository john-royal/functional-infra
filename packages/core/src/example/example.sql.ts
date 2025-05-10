import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const exampleTable = pgTable("example", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});
