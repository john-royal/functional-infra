import { createId } from "@paralleldrive/cuid2";
import { createTransaction, eq, schema, useTransaction } from "../db";
import { Environment } from "../environment";

export namespace Project {
  export function list(teamId: string) {
    return useTransaction((tx) =>
      tx
        .select()
        .from(schema.projects)
        .where(eq(schema.projects.teamId, teamId)),
    );
  }

  export function byRepositoryId(repositoryId: number) {
    return useTransaction(async (tx) => {
      const projects = await tx
        .select()
        .from(schema.projects)
        .where(eq(schema.projects.githubRepositoryId, repositoryId))
        .limit(1);
      return projects.length === 1 ? projects[0] : null;
    });
  }

  export function create(input: Omit<schema.NewProject, "id">) {
    return createTransaction(async (tx) => {
      const id = createId();
      await tx.insert(schema.projects).values({
        id,
        ...input,
      });
      await Promise.all([
        Environment.create(id, "Production", true),
        Environment.create(id, "Staging", false),
      ]);
      return id;
    });
  }
}
