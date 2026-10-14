import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const distServer = path.join(process.cwd(), "dist", "server.cjs");
const isProduction =
  process.env.NODE_ENV === "production" ||
  (!process.env.npm_lifecycle_event?.includes("dev") && fs.existsSync(distServer));

if (isProduction && fs.existsSync(distServer)) {
  const require = createRequire(import.meta.url);
  require(distServer);
} else {
  await import("./server.app.ts");
}
