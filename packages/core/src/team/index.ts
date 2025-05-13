import { createId } from "@paralleldrive/cuid2";
import { TRPCError } from "@trpc/server";
import { and, eq, getTableColumns, schema, useTransaction } from "../db";
import assert from "node:assert";

export namespace Team {
  export function list(userId: string) {
    return useTransaction(async (tx) => {
      return tx
        .select(getTableColumns(schema.teams))
        .from(schema.teamMembers)
        .innerJoin(schema.teams, eq(schema.teamMembers.teamId, schema.teams.id))
        .where(eq(schema.teamMembers.userId, userId));
    });
  }

  export function byId(userId: string, teamId: string) {
    return useTransaction(async (tx) => {
      const teams = await tx
        .select(getTableColumns(schema.teams))
        .from(schema.teamMembers)
        .innerJoin(schema.teams, eq(schema.teamMembers.teamId, schema.teams.id))
        .where(
          and(
            eq(schema.teamMembers.userId, userId),
            eq(schema.teamMembers.teamId, teamId),
          ),
        );
      assert(teams.length === 1, `Team ${teamId} not found`);
      return teams[0];
    });
  }

  export function create(name: string, type: "personal" | "organization") {
    return useTransaction(async (tx) => {
      const id = createId();
      const slug = name.toLowerCase().replace(/\s+/g, "-");
      await tx.insert(schema.teams).values({
        id,
        name,
        slug,
        type,
      });
      return { id, slug };
    });
  }
}

export namespace TeamMember {
  export function assert(userId: string, teamId: string) {
    return useTransaction(async (tx) => {
      const count = await tx.$count(
        tx
          .select()
          .from(schema.teamMembers)
          .where(
            and(
              eq(schema.teamMembers.teamId, teamId),
              eq(schema.teamMembers.userId, userId),
            ),
          ),
      );
      if (count === 0) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
    });
  }

  export function create(
    userId: string,
    teamId: string,
    role: "owner" | "admin" | "member",
  ) {
    return useTransaction(async (tx) => {
      await tx.insert(schema.teamMembers).values({
        userId,
        teamId,
        role,
      });
    });
  }
}
