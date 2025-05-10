import { createHash } from "node:crypto";
import { glob, readFile } from "node:fs/promises";
import { join } from "node:path";

export const hashFiles = async (dir: string, patterns: string[]) => {
  const hash = createHash("sha256");
  for await (const file of glob(patterns, { cwd: dir })) {
    const filePath = join(dir, file);
    hash.update(await readFile(filePath, "utf-8"));
  }
  const digest = hash.digest("hex");
  return digest;
};
