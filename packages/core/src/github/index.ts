import { createId } from "@paralleldrive/cuid2";
import assert from "node:assert";
import { App } from "octokit";
import { Resource } from "sst";
import { schema, useTransaction, eq } from "../db";
import type {
  InstallationDeletedEvent,
  WebhookEvent,
} from "@octokit/webhooks-types";

export namespace GitHub {
  const app = new App({
    appId: Resource.GITHUB_APP_ID.value,
    privateKey: Resource.GITHUB_PRIVATE_KEY.value,
  });

  export async function install(installationId: number, teamId: string) {
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

  export async function installations(teamId: string) {
    const installations = await useTransaction(async (tx) => {
      return tx
        .select()
        .from(schema.githubInstallations)
        .where(eq(schema.githubInstallations.teamId, teamId));
    });
    return installations;
  }

  export async function deleteInstallation(id: string) {
    await useTransaction(async (tx) => {
      console.log("deleted", id);
      await tx
        .delete(schema.githubInstallations)
        .where(eq(schema.githubInstallations.installationId, id));
    });
  }
}
