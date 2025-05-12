// To be continued, when SST improves their Cloudflare support...

import { issuer } from "@openauthjs/openauth";
import { GithubProvider } from "@openauthjs/openauth/provider/github";
import { Resource } from "sst";
import { User } from "@functional-infra/core/example";
import z from "zod";
import { createSubjects } from "@openauthjs/openauth/subject";
// import { CloudflareStorage } from "@openauthjs/openauth/storage/cloudflare";

const subjects = createSubjects({
  user: z.object({
    id: z.string(),
    defaultTeamId: z.string(),
  }),
});

export default {
  fetch: async (req: Request, env: unknown, ctx: ExecutionContext) => {
    const iss = issuer({
      subjects,
      //   storage: CloudflareStorage({
      //     namespace: Resource.AuthKV,
      //   }),
      providers: {
        github: GithubProvider({
          clientID: Resource.GITHUB_CLIENT_ID.value,
          clientSecret: Resource.GITHUB_CLIENT_SECRET.value,
          scopes: [],
        }),
      },
      success: async (ctx, input) => {
        const profile = await fetchGitHubProfile(input.tokenset.access);
        const { userId, defaultTeamId } = await User.findOrCreate(profile, {
          accessToken: input.tokenset.access,
          refreshToken: input.tokenset.refresh,
          accessTokenExpiresAt: new Date(
            Date.now() + input.tokenset.expiry * 1000,
          ),
        });
        return ctx.subject("user", {
          id: userId,
          defaultTeamId,
        });
      },
    });
    return await iss.fetch(req, env, ctx);
  },
} satisfies ExportedHandler;

const fetchGitHubProfile = async (accessToken: string) => {
  const userInfo = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "Functional (Dev)",
    },
  }).then(
    (res) =>
      res.json() as Promise<{
        id: number;
        name: string;
        login: string;
        email: string;
        avatar_url: string;
      }>,
  );
  if (!userInfo.email) {
    const emails = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "User-Agent": "Functional.dev",
      },
    }).then(
      (res) =>
        res.json() as Promise<
          {
            email: string;
            primary: boolean;
            verified: boolean;
            visibility: string;
          }[]
        >,
    );
    const email =
      emails.find((email) => email.primary)?.email ?? emails[0]?.email;
    if (!email) {
      throw new Error("No email found");
    }
    userInfo.email = email;
  }
  return userInfo;
};
