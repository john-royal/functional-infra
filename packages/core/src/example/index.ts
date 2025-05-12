import assert from "node:assert";
import { createId } from "@paralleldrive/cuid2";
import {
  and,
  createTransaction,
  eq,
  getTableColumns,
  schema,
  useTransaction,
} from "../db";

export namespace User {
  export function findOrCreate(
    profile: {
      id: number;
      name: string;
      login: string;
      email: string;
      avatar_url: string;
    },
    credentials: {
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresAt: Date;
    },
  ) {
    return createTransaction(async () => {
      const user = await User.byGitHubId(profile.id.toString());
      if (user) return user;
      const team = await Team.create(profile.name, "personal");
      const userId = await User.create({
        name: profile.name,
        email: profile.email,
        image: profile.avatar_url,
        defaultTeamId: team.id,
      });
      await Promise.all([
        GitHubAccount.create({
          id: profile.id.toString(),
          userId,
          githubId: profile.id.toString(),
          username: profile.login,
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          accessTokenExpiresAt: credentials.accessTokenExpiresAt,
        }),
        TeamMember.create(userId, team.id, "owner"),
      ]);
      return { userId, defaultTeam: team.slug };
    });
  }

  export function byId(id: string) {
    return useTransaction(async (tx) => {
      const users = await tx
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, id))
        .limit(1);
      assert(users.length === 1, `User ${id} not found`);
      return users[0];
    });
  }

  export function byGitHubId(id: string) {
    return useTransaction(async (tx) => {
      const users = await tx
        .select({
          userId: schema.users.id,
          defaultTeam: schema.teams.slug,
        })
        .from(schema.githubAccounts)
        .where(eq(schema.githubAccounts.githubId, id))
        .innerJoin(
          schema.users,
          eq(schema.githubAccounts.userId, schema.users.id),
        )
        .innerJoin(
          schema.teams,
          eq(schema.users.defaultTeamId, schema.teams.id),
        );
      return users.length > 0 ? users[0] : null;
    });
  }

  export function create(profile: {
    name: string;
    email: string;
    defaultTeamId: string;
    image?: string;
  }) {
    return useTransaction(async (tx) => {
      const id = createId();
      await tx.insert(schema.users).values({
        id,
        name: profile.name,
        email: profile.email,
        defaultTeamId: profile.defaultTeamId,
        image: profile.image,
      });
      return id;
    });
  }
}

export namespace GitHubAccount {
  export function create(profile: {
    id: string;
    userId: string;
    githubId: string;
    username: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date;
  }) {
    return useTransaction(async (tx) => {
      await tx.insert(schema.githubAccounts).values(profile);
    });
  }
}

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
        .select()
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
