import {
  bigint,
  boolean,
  char,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

const cuid = () => char({ length: 24 });

const timestamps = {
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp()
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
};

export const users = pgTable("users", {
  id: cuid().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  image: varchar({ length: 255 }),
  defaultTeamId: cuid()
    .notNull()
    .references(() => teams.id),
  ...timestamps,
});

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export const githubAccounts = pgTable("github_accounts", {
  id: cuid().primaryKey(),
  userId: cuid()
    .notNull()
    .unique()
    .references(() => users.id),
  githubId: varchar({ length: 255 }).notNull().unique(),
  username: varchar({ length: 255 }).notNull(),
  accessToken: varchar({ length: 255 }).notNull(),
  refreshToken: varchar({ length: 255 }),
  accessTokenExpiresAt: timestamp(),
  ...timestamps,
});

export type NewGitHubAccount = typeof githubAccounts.$inferInsert;
export type GitHubAccount = typeof githubAccounts.$inferSelect;

export const teamType = pgEnum("team_type", ["personal", "organization"]);

export const teams = pgTable("teams", {
  id: cuid().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  type: teamType().notNull(),
  ...timestamps,
});

export const teamRole = pgEnum("team_role", ["owner", "admin", "member"]);

export const teamMembers = pgTable(
  "team_members",
  {
    teamId: cuid()
      .notNull()
      .references(() => teams.id),
    userId: cuid()
      .notNull()
      .references(() => users.id),
    role: teamRole().notNull(),
    ...timestamps,
  },
  (t) => [primaryKey({ columns: [t.teamId, t.userId] })],
);

export type TeamMember = typeof teamMembers.$inferSelect;

export const targetType = pgEnum("target_type", ["user", "organization"]);

export const githubInstallations = pgTable("github_installations", {
  id: cuid().primaryKey(),
  teamId: cuid()
    .notNull()
    .references(() => teams.id),
  installationId: varchar({ length: 255 }).notNull().unique(),
  targetType: targetType().notNull(),
  targetId: bigint({ mode: "number" }).notNull(),
  targetName: varchar({ length: 255 }).notNull(),
  accessToken: varchar({ length: 255 }),
  accessTokenExpiresAt: timestamp(),
  ...timestamps,
});

export type NewGitHubInstallation = typeof githubInstallations.$inferInsert;
export type GitHubInstallation = typeof githubInstallations.$inferSelect;

export const projects = pgTable("projects", {
  id: cuid().primaryKey(),
  teamId: cuid()
    .notNull()
    .references(() => teams.id),
  githubInstallationId: cuid()
    .notNull()
    .references(() => githubInstallations.id),
  githubRepositoryId: bigint({ mode: "number" }).notNull(),
  githubRepositoryName: varchar({ length: 255 }).notNull(),
  gitProductionBranch: varchar({ length: 100 }).notNull().default("main"),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  ...timestamps,
});

export type NewProject = typeof projects.$inferInsert;
export type Project = typeof projects.$inferSelect;

export const environments = pgTable("environments", {
  id: cuid().primaryKey(),
  projectId: cuid()
    .notNull()
    .references(() => projects.id),
  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  ...timestamps,
});

export type NewEnvironment = typeof environments.$inferInsert;
export type Environment = typeof environments.$inferSelect;

export const environmentVariables = pgTable("environment_variables", {
  id: cuid().primaryKey(),
  projectId: cuid()
    .notNull()
    .references(() => projects.id),
  environmentId: cuid()
    .notNull()
    .references(() => environments.id),
  name: varchar({ length: 255 }).notNull(),
  value: varchar({ length: 255 }).notNull(),
  isSecret: boolean().notNull(),
  ...timestamps,
});

export type NewEnvironmentVariable = typeof environmentVariables.$inferInsert;
export type EnvironmentVariable = typeof environmentVariables.$inferSelect;

export const deploymentStatus = pgEnum("deployment_status", [
  "queued",
  "in_progress",
  "success",
  "failed",
  "canceled",
]);

export const deploymentTrigger = pgEnum("deployment_trigger", [
  "push",
  "manual",
]);

export const deployments = pgTable("deployments", {
  id: cuid().primaryKey(),
  projectId: cuid()
    .notNull()
    .references(() => projects.id),
  environmentId: cuid()
    .notNull()
    .references(() => environments.id),
  gitCommitHash: varchar({ length: 255 }).notNull(),
  gitCommitMessage: varchar({ length: 255 }).notNull(),
  gitCommitAuthor: varchar({ length: 255 }).notNull(),
  gitCommitAuthorEmail: varchar({ length: 255 }).notNull(),
  gitCommitDate: timestamp().notNull(),
  status: deploymentStatus().notNull(),
  trigger: deploymentTrigger().notNull(),
  ...timestamps,
});

export type NewDeployment = typeof deployments.$inferInsert;
export type Deployment = typeof deployments.$inferSelect;
