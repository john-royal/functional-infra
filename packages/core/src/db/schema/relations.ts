import { relations } from "drizzle-orm";
import {
  deployments,
  environmentVariables,
  environments,
  githubAccounts,
  githubInstallations,
  projects,
  teamMembers,
  teams,
  users,
} from "./tables";

export const usersRelations = relations(users, ({ one, many }) => ({
  githubAccounts: one(githubAccounts, {
    fields: [users.id],
    references: [githubAccounts.userId],
  }),
  teamMembers: many(teamMembers),
}));

export const githubAccountsRelations = relations(githubAccounts, ({ one }) => ({
  user: one(users, {
    fields: [githubAccounts.userId],
    references: [users.id],
  }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  githubInstallations: many(githubInstallations),
  projects: many(projects),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
}));

export const githubInstallationsRelations = relations(
  githubInstallations,
  ({ one }) => ({
    team: one(teams, {
      fields: [githubInstallations.teamId],
      references: [teams.id],
    }),
  }),
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  team: one(teams, {
    fields: [projects.teamId],
    references: [teams.id],
  }),
  githubInstallation: one(githubInstallations, {
    fields: [projects.githubInstallationId],
    references: [githubInstallations.id],
  }),
  environments: many(environments),
  environmentVariables: many(environmentVariables),
  deployments: many(deployments),
}));

export const environmentsRelations = relations(
  environments,
  ({ one, many }) => ({
    project: one(projects, {
      fields: [environments.projectId],
      references: [projects.id],
    }),
    environmentVariables: many(environmentVariables),
  }),
);

export const environmentVariablesRelations = relations(
  environmentVariables,
  ({ one }) => ({
    project: one(projects, {
      fields: [environmentVariables.projectId],
      references: [projects.id],
    }),
    environment: one(environments, {
      fields: [environmentVariables.environmentId],
      references: [environments.id],
    }),
  }),
);

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  project: one(projects, {
    fields: [deployments.projectId],
    references: [projects.id],
  }),
  environment: one(environments, {
    fields: [deployments.environmentId],
    references: [environments.id],
  }),
}));
