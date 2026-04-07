import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appRoot, "../..");

const workspaceAliases = {
  "@verdicta/ai": path.join(repoRoot, "packages/ai/src/index.ts"),
  "@verdicta/core": path.join(repoRoot, "packages/core/src/index.ts"),
  "@verdicta/db": path.join(repoRoot, "packages/db/src/index.ts"),
  "@verdicta/ingestion": path.join(repoRoot, "packages/ingestion/src/index.ts"),
  "@verdicta/legal": path.join(repoRoot, "packages/legal/src/index.ts"),
  "@verdicta/shared": path.join(repoRoot, "packages/shared/src/index.ts"),
  "@verdicta/ui": path.join(repoRoot, "packages/ui/src/index.ts")
};

const sharedOptions = {
  absWorkingDir: appRoot,
  bundle: true,
  color: true,
  external: ["electron", "better-sqlite3"],
  logLevel: "info",
  platform: "node",
  sourcemap: true,
  tsconfig: path.join(appRoot, "tsconfig.json"),
  alias: workspaceAliases
};

await Promise.all([
  build({
    ...sharedOptions,
    entryPoints: ["src/main/main.ts"],
    format: "cjs",
    outfile: "dist-electron/main/main.cjs",
    target: "node20"
  }),
  build({
    ...sharedOptions,
    entryPoints: ["src/preload/index.ts"],
    format: "cjs",
    outfile: "dist-electron/preload/index.cjs",
    target: "node20"
  })
]);
