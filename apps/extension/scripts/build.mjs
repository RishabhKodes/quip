import { cpSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const extensionRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const watch = process.argv.includes("--watch");

for (const entry of ["content", "background", "popup"]) {
  runVite(entry);
}

cpSync(resolve(extensionRoot, "public"), resolve(extensionRoot, "dist"), {
  recursive: true,
});

if (watch) {
  runVite("content", true);
}

function runVite(entry, shouldWatch = false) {
  const result = spawnSync(
    pnpmCommand,
    ["exec", "vite", "build", ...(shouldWatch ? ["--watch"] : [])],
    {
      cwd: extensionRoot,
      env: {
        ...process.env,
        ENTRY: entry,
        NODE_ENV: shouldWatch ? "development" : "production",
      },
      stdio: "inherit",
    },
  );

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
