/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "functional-infra",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: { neon: "0.9.0", command: "1.0.4", random: "4.18.2" },
    };
  },
  async run() {
    const storage = await import("./infra/storage");
    await import("./infra/api");
    await import("./infra/neon");
    await import("./infra/auth");
    return {
      MyBucket: storage.bucket.name,
    };
  },
});
