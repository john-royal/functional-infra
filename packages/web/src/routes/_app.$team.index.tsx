import { useTRPC } from "@/lib/trpc";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/$team/")({
  component: RouteComponent,
  loader: ({ context, params }) => {
    void context.queryClient.prefetchQuery(
      context.trpc.team.bySlug.queryOptions({ slug: params.team }),
    );
  },
  pendingComponent: () => <div>Loading...</div>,
});

function RouteComponent() {
  const { team } = Route.useParams();
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.team.bySlug.queryOptions({ slug: team }),
  );
  const q = useQuery(
    trpc.githubInstallations.list.queryOptions({ teamId: data.team.id }),
  );
  const r = useQuery({
    ...trpc.githubInstallations.listRepositories.queryOptions({
      installationId: q.data?.[0].id ?? "",
      teamId: data.team.id,
    }),
    enabled: !!q.data?.[0],
  });
  return (
    <pre>
      {JSON.stringify(
        {
          team: data.team,
          projects: data.projects,
          installations: q.data,
          repositories: r.data?.repositories,
        },
        null,
        2,
      )}
    </pre>
  );
}
