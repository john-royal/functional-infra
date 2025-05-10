import { issuer } from "@openauthjs/openauth";
import { GithubProvider } from "@openauthjs/openauth/provider/github";
import { handle } from "hono/aws-lambda";
import { Resource } from "sst";
import { subjects } from "./subjects";
import { db, schema, eq } from "@functional-infra/core/db";
import { createId } from "@paralleldrive/cuid2";

const iss = issuer({
  subjects,
  providers: {
    github: GithubProvider({
      clientID: Resource.GITHUB_CLIENT_ID.value,
      clientSecret: Resource.GITHUB_CLIENT_SECRET.value,
      scopes: ["user:email", "read:user"],
    }),
  },
  success: async (ctx, input) => {
    const profile = await fetchGitHubProfile(input.tokenset.access);
    const user = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select({
          id: schema.users.id,
          name: schema.users.name,
          email: schema.users.email,
          image: schema.users.image,
        })
        .from(schema.githubAccounts)
        .where(eq(schema.githubAccounts.githubId, profile.id.toString()))
        .innerJoin(
          schema.users,
          eq(schema.githubAccounts.userId, schema.users.id),
        );
      if (existing) {
        return existing;
      }
      const newUser = {
        id: createId(),
        name: profile.name,
        email: profile.email,
        image: profile.avatar_url,
      };
      await tx.insert(schema.users).values(newUser);
      await tx.insert(schema.githubAccounts).values({
        id: createId(),
        userId: newUser.id,
        githubId: profile.id.toString(),
        username: profile.login,
        accessToken: input.tokenset.access,
        accessTokenExpiresAt: input.tokenset.expiry
          ? new Date(input.tokenset.expiry)
          : undefined,
        refreshToken: input.tokenset.refresh,
      });
      return newUser;
    });
    return ctx.subject("user", {
      id: user.id,
    });
  },
});

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
        "User-Agent": "ChatOS (Dev)",
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

export const handler = handle(iss);
