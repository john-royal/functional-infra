import { Button } from "@/components/ui/button";
import { redirectToSignIn } from "@/lib/auth";
import { getSubject } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/auth/")({
  component: RouteComponent,
  loader: async () => {
    const { subject } = await getSubject();
    if (subject) {
      throw redirect({ to: "/" });
    }
    return;
  },
});

function RouteComponent() {
  const signIn = useServerFn(redirectToSignIn);

  return (
    <div>
      <Button type="button" onClick={() => signIn()}>
        Sign in
      </Button>
    </div>
  );
}
