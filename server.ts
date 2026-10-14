// Clean up tsx / runner global pollution so ESM libraries (e.g. vite-plugin-pwa) correctly use import.meta.url in Node 24
if (typeof (globalThis as any).__dirname !== "undefined" && (globalThis as any).__dirname === ".") {
  delete (globalThis as any).__dirname;
}
if (typeof (global as any).__dirname !== "undefined" && (global as any).__dirname === ".") {
  delete (global as any).__dirname;
}

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const distServer = path.join(process.cwd(), "dist", "server.cjs");
const isProduction =
  process.env.NODE_ENV === "production" ||
  (process.env.npm_lifecycle_event === "start" && fs.existsSync(distServer));

if (isProduction && fs.existsSync(distServer)) {
  const require = createRequire(import.meta.url);
  require(distServer);
} else {
  await import("./server.app.ts");
}

