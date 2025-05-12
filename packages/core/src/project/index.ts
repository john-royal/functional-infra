import { createId } from "@paralleldrive/cuid2";
import { eq, schema, useTransaction } from "../db";

export namespace Project {
  export async function list(teamId: string) {
    return useTransaction((tx) =>
      tx
        .select()
        .from(schema.projects)
        .where(eq(schema.projects.teamId, teamId)),
    );
  }

  export async function create(input: Omit<schema.NewProject, "id">) {
    return useTransaction(async (tx) => {
      const id = createId();
      await tx.insert(schema.projects).values({
        id,
        ...input,
      });
      return id;
    });
  }
}
