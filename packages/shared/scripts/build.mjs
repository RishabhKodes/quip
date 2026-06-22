import { rmSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

rmSync(resolve(packageRoot, "dist"), { recursive: true, force: true });

const result = spawnSync(
  pnpmCommand,
  ["exec", "tsc", "-b", "tsconfig.json", "--force"],
  {
    cwd: packageRoot,
    stdio: "inherit",
  },
);

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
