import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const standalone = resolve(root, ".next", "standalone");

if (!existsSync(standalone)) process.exit(0);

const staticTarget = resolve(standalone, ".next", "static");
mkdirSync(resolve(standalone, ".next"), { recursive: true });
cpSync(resolve(root, ".next", "static"), staticTarget, { recursive: true, force: true });
cpSync(resolve(root, "public"), resolve(standalone, "public"), { recursive: true, force: true });
