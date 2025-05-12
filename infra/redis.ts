sst.Linkable.wrap(upstash.RedisDatabase, (resource) => ({
  properties: {
    url: $interpolate`https://${resource.endpoint}`,
    token: resource.restToken,
  },
}));

export const redis = new upstash.RedisDatabase("Redis", {
  databaseName: `${$app.name}-${$app.stage}-redis`,
  region: "global",
  primaryRegion: "us-east-1",
  tls: true,
});
