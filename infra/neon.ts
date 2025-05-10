import { join } from "node:path";
import { hashFiles } from "./utils";

sst.Linkable.wrap(neon.Project, (resource) => ({
  properties: {
    connectionUri: $util.secret(resource.connectionUri),
    connectionUriPooler: $util.secret(resource.connectionUriPooler),
  },
}));

export const neonProject = new neon.Project("Neon", {
  name: $interpolate`${$app.name}-${$app.stage}`,
});

new command.local.Command(
  "NeonPush",
  {
    create: "bun run db:push",
    dir: join(process.cwd(), "packages/core"),
    triggers: [
      hashFiles("packages/core", [
        "package.json",
        "drizzle.config.ts",
        "src/db/schema/*.ts",
      ]),
    ],
    environment: {
      SST_RESOURCE_App: JSON.stringify($app),
      SST_RESOURCE_Neon: $jsonStringify({
        connectionUri: neonProject.connectionUri,
      }),
    },
  },
  { dependsOn: neonProject },
);
