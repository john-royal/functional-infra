import { createId } from "@paralleldrive/cuid2";
import assert from "node:assert";
import { App } from "octokit";
import { Resource } from "sst";
import { and, eq, schema, useTransaction } from "../db";

export namespace GithubInstallation {
  export const app = new App({
    appId: Resource.GITHUB_APP_ID.value,
    privateKey: Resource.GITHUB_PRIVATE_KEY.value,
  });

  export async function create(installationId: number, teamId: string) {
    const installation = await app.octokit.rest.apps.getInstallation({
      installation_id: installationId,
    });
    assert(installation.data.account);
    const fields = {
      installationId: installation.data.id.toString(),
      targetType:
        installation.data.target_type === "Organization"
          ? "organization"
          : "user",
      targetId: installation.data.target_id,
      targetName:
        "login" in installation.data.account
          ? installation.data.account.login
          : installation.data.account.slug,
    } as const;
    await useTransaction(async (tx) => {
      assert(installation.data.account);
      await tx
        .insert(schema.githubInstallations)
        .values({
          id: createId(),
          teamId,
          ...fields,
        })
        .onConflictDoUpdate({
          target: schema.githubInstallations.installationId,
          set: fields,
        });
    });
  }

  export async function get(installationId: string, teamId: string) {
    return await useTransaction(async (tx) => {
      const [installation] = await tx
        .select()
        .from(schema.githubInstallations)
        .where(
          and(
            eq(schema.githubInstallations.id, installationId),
            eq(schema.githubInstallations.teamId, teamId),
          ),
        )
        .limit(1);
      assert(installation, `Installation ${installationId} not found`);
      return installation;
    });
  }

  export async function list(teamId: string) {
    return await useTransaction(async (tx) => {
      return tx
        .select()
        .from(schema.githubInstallations)
        .where(eq(schema.githubInstallations.teamId, teamId));
    });
  }

  export async function del(id: string) {
    await useTransaction(async (tx) => {
      await tx
        .delete(schema.githubInstallations)
        .where(eq(schema.githubInstallations.installationId, id));
    });
  }

  export async function listRepositories(
    installationId: string,
    teamId: string,
  ) {
    const installation = await get(installationId, teamId);
    const octokit = await app.getInstallationOctokit(
      Number(installation.installationId),
    );
    const res = await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 100,
    });
    const repositories = res.data.repositories
      .map((repo) => ({
        id: repo.id,
        name: repo.full_name,
        url: repo.url,
        updatedAt: repo.updated_at,
      }))
      .sort((a, b) => {
        if (!a.updatedAt || !b.updatedAt) {
          return 0;
        }
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
    return {
      repositories,
      currentCount: res.data.repositories.length,
      count: res.data.total_count,
    };
  }
}
