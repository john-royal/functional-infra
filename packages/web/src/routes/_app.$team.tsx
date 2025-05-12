import { useTRPC } from "@/lib/trpc";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/$team")({
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
  return <div>{JSON.stringify(data, null, 2)}</div>;
}
