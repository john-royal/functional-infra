import { handleCallback } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";
import { callbackSchema } from "@/lib/auth";

export const Route = createFileRoute("/auth/callback")({
  component: RouteComponent,
  validateSearch: callbackSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => await handleCallback({ data: deps }),
});

function RouteComponent() {
  const data = Route.useLoaderData();
  return <div>{JSON.stringify(data)}</div>;
}
