import { createId } from "@paralleldrive/cuid2";
import { and, eq, schema, useTransaction } from "../db";
import assert from "node:assert";

export namespace Environment {
  export function list(projectId: string) {
    return useTransaction((tx) =>
      tx
        .select()
        .from(schema.environments)
        .where(eq(schema.environments.projectId, projectId)),
    );
  }

  export function find(projectId: string, isProduction: boolean) {
    return useTransaction(async (tx) => {
      const environments = await tx
        .select()
        .from(schema.environments)
        .where(
          and(
            eq(schema.environments.projectId, projectId),
            eq(schema.environments.isProduction, isProduction),
          ),
        )
        .limit(1);
      assert(environments.length === 1, "Environment not found");
      return environments[0];
    });
  }

  export function create(
    projectId: string,
    name: string,
    isProduction: boolean,
  ) {
    return useTransaction(async (tx) => {
      const id = createId();
      await tx.insert(schema.environments).values({
        id,
        projectId,
        name,
        isProduction,
      });
      return id;
    });
  }
}
