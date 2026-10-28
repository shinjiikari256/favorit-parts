// load-env.js
import dotenv from "dotenv";
import fs from "fs";
import minimist from "minimist";
import path from "path";

export function loadEnv(rootDir = process.cwd()) {
  const args = minimist(process.argv.slice(2));
  const mode = args.mode ?? "development";

  const envFiles = [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`];

  for (const file of envFiles) {
    const fullPath = path.resolve(rootDir, file);
    if (!fs.existsSync(fullPath)) continue;

    dotenv.config({
      path: fullPath,
      override: false, // как у Vite
    });
  }

  return mode;
}
