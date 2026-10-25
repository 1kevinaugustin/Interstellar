import { existsSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

// Netlify serves dist/ statically, so mirror the page routes src/server.js would register.
const require = createRequire(import.meta.url);
const DIST_DIR = path.join(process.cwd(), "dist");
const RUNTIME_DIR = path.join(DIST_DIR, ".runtime");
const VENDOR_MAP_PATH = path.join(RUNTIME_DIR, "vendor-map.cjs");

if (!existsSync(VENDOR_MAP_PATH)) throw new Error("dist/.runtime/vendor-map.cjs is missing, run `pnpm build` first");
const vendorMap = require(VENDOR_MAP_PATH);

const routes = [
  { path: "/apps", file: "apps.html" },
  { path: "/games", file: "games.html" },
  { path: "/play.html", file: "games.html" },
  { path: "/settings", file: "settings.html" },
  { path: "/tabs", file: "tabs.html" },
  { path: "/home", file: "home.html" },
];

const lines = [];
for (const route of routes) {
  const servePath = vendorMap.routes?.[route.path] || route.path;
  lines.push(`${servePath} /${route.file} 200!`);
}
lines.push("/* /404.html 404");

await writeFile(path.join(DIST_DIR, "_redirects"), `${lines.join("\n")}\n`, "utf8");
// The vendor map is server-only and must never be published.
await rm(RUNTIME_DIR, { recursive: true, force: true });
console.log(`Wrote dist/_redirects with ${lines.length} rules`);
