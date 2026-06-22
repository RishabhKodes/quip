import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const apiRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

rmSync(resolve(apiRoot, "dist"), { recursive: true, force: true });

const result = spawnSync(
  pnpmCommand,
  ["exec", "tsc", "-p", "tsconfig.build.json"],
  {
    cwd: apiRoot,
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
