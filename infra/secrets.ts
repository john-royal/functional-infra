sst.Linkable.wrap(random.RandomPassword, (resource) => ({
  properties: {
    value: $util.secret(resource.result),
  },
}));

export const GITHUB_PRIVATE_KEY = new sst.Secret("GITHUB_PRIVATE_KEY");
export const GITHUB_APP_ID = new sst.Secret("GITHUB_APP_ID");
export const GITHUB_CLIENT_ID = new sst.Secret("GITHUB_CLIENT_ID");
export const GITHUB_CLIENT_SECRET = new sst.Secret("GITHUB_CLIENT_SECRET");
export const GITHUB_WEBHOOK_SECRET = new random.RandomPassword(
  "GITHUB_WEBHOOK_SECRET",
  {
    length: 64,
  },
);
export const GITHUB_STATE_SECRET = new random.RandomPassword(
  "GITHUB_STATE_SECRET",
  {
    length: 32,
  },
);
