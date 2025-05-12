import { type Subject, subjects } from "@functional-infra/core/auth";
import {
  type Challenge,
  type Tokens,
  createClient,
} from "@openauthjs/openauth/client";
import { redirect } from "@tanstack/react-router";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { Resource } from "sst";
import { z } from "zod";

type Session =
  | { type: "tokens"; properties: Tokens }
  | { type: "challenge"; properties: Challenge };

function useAppSession() {
  return useSession<Session>({
    password: Resource.WEB_SESSION_SECRET.value,
  });
}

const authClient = createClient({
  issuer: Resource.Auth.url,
  clientID: "web-prod",
});

type Context =
  | { accessToken: string; subject: Subject }
  | { accessToken: null; subject: null };

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await useAppSession();
  if (session.data.type === "tokens") {
    const { access, refresh } = session.data.properties;
    const res = await authClient.verify(subjects, access, { refresh });
    if (res.err) {
      await session.clear();
      return next<Context>({ context: { accessToken: null, subject: null } });
    }
    if (res.tokens) {
      await session.update({ type: "tokens", properties: res.tokens });
    }
    return next<Context>({
      context: {
        accessToken: session.data.properties.access,
        subject: res.subject,
      },
    });
  }
  return next<Context>({ context: { accessToken: null, subject: null } });
});

export const getSubject = createServerFn()
  .middleware([authMiddleware])
  .handler(({ context }) => ({
    accessToken: context.accessToken,
    subject: context.subject,
  }));

export const redirectToSignIn = createServerFn().handler(async () => {
  const session = await useAppSession();
  const { url, challenge } = await authClient.authorize(
    `${import.meta.env.VITE_ORIGIN ?? process.env.VITE_ORIGIN}/auth/callback`,
    "code",
    { provider: "github" },
  );
  await session.update({ type: "challenge", properties: challenge });
  throw redirect({ href: url });
});

export const callbackSchema = z.union([
  z.object({
    state: z.string(),
    code: z.string(),
  }),
  z.object({
    error: z.string(),
    error_description: z.string(),
  }),
]);

export const handleCallback = createServerFn()
  .validator(callbackSchema)
  .handler(async ({ data }) => {
    if ("error" in data) {
      return { error: data.error, error_description: data.error_description };
    }
    const { state, code } = data;
    const session = await useAppSession();
    if (session.data.type !== "challenge") {
      return { error: "Invalid session" };
    }
    if (session.data.properties.state !== state) {
      return { error: "Invalid state" };
    }
    const res = await authClient.exchange(
      code,
      `${import.meta.env.VITE_ORIGIN ?? process.env.VITE_ORIGIN}/auth/callback`,
      session.data.properties.verifier,
    );
    if (res.err) {
      return { error: res.err.message };
    }
    await session.update({ type: "tokens", properties: res.tokens });
    throw redirect({ to: "/" });
  });

export const signOut = createServerFn().handler(async () => {
  const session = await useAppSession();
  await session.clear();
  throw redirect({ to: "/" });
});
