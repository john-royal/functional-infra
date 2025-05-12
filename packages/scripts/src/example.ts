import { GithubInstallation } from "@functional-infra/core/github-installation";
import { pool } from "@functional-infra/core/db";

const installation = await GithubInstallation.get(
  "r4dv6k7h6w9w2fd2iwu74c0q",
  "",
);
console.log(installation);

const octokit = await GithubInstallation.app.getInstallationOctokit(
  Number(installation.installationId),
);
const res = await octokit.rest.apps.listReposAccessibleToInstallation();

console.log({
  repositories: res.data.repositories.map((repo) => ({
    id: repo.id,
    name: repo.name,
  })),
  repository_selection: res.data.repository_selection,
  total_count: res.data.total_count,
});

await pool.end();
