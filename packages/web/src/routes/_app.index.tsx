import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  loader: ({ context }) => {
    throw redirect({
      to: "/$team",
      params: { team: context.subject.properties.defaultTeam },
    });
  },
});
