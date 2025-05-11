import { db, pool, schema } from "@functional-infra/core/db";
import { Octokit, App } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import { Resource } from "sst";

const [account] = await db.select().from(schema.githubAccounts).limit(1);
// const octokit = new Octokit({
//   auth: account.accessToken,
// });

// const res = await octokit.rest.apps.getAuthenticated();
// console.log(res.data);
// console.log(user.data);

const app = new App({
  appId: Resource.GITHUB_APP_ID.value,
  privateKey: Resource.GITHUB_PRIVATE_KEY.value,
});
// const token = await app.octokit.rest.apps.createInstallationAccessToken({
//   installation_id: 664,
// });
// const octokit = new Octokit({
//   auth: token.data.token,
// });
const installation = await app.octokit.rest.apps.getInstallation({
  installation_id: 66464689,
});
console.log(installation.data);
// const res = await app.octokit.rest.repos.listForUser({
//   username: account.username,
// });
// console.log(res.data);
// const installation = await octokit.rest.apps.getInstallation();
// console.log(installation);
// const repositories = await octokit.rest.repos.listForAuthenticatedUser({
//   // type: "all",
//   affiliation: "owner,organization_member",
//   sort: "updated",
//   //   direction: "desc",
//   //   per_page: 100,
// });
// console.dir(
//   repositories.data.map((repo) => ({
//     id: repo.id,
//     name: repo.name,
//     full_name: repo.full_name,
//     private: repo.private,
//     description: repo.description,
//     default_branch: repo.default_branch,
//     owner: {
//       id: repo.owner.id,
//       login: repo.owner.login,
//       type: repo.owner.type,
//     },
//   })),
//   { depth: null },
// );
// console.log(repositories.headers);

pool.end();
