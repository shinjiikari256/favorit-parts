import { transformSync } from "esbuild";
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const REST_DIR = "./src/api/rest";
const ENDPOINTS_DIR = `${REST_DIR}/endpoints`;
const MODEL_DIR = `${REST_DIR}/model`;

// Orval генерирует только .ts — переводим в чистый JS (esbuild убирает типы, ESM сохраняется).
// Оригинальные .ts и каталог model/ удаляем: проект без TypeScript.
function convertTsToJs(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      convertTsToJs(full);
      continue;
    }
    if (!entry.endsWith(".ts")) continue;
    const { code } = transformSync(readFileSync(full, "utf8"), {
      loader: "ts",
      format: "esm",
      target: "es2022",
      tsconfigRaw: { compilerOptions: { verbatimModuleSyntax: false } },
    });
    writeFileSync(full.replace(/\.ts$/, ".js"), code);
    rmSync(full);
  }
}

console.log("Генерация REST API (orval)...");
execSync("orval --config orval/orval.config.js", { stdio: "inherit" });

console.log("Конвертация .ts → .js...");
convertTsToJs(ENDPOINTS_DIR);
rmSync(MODEL_DIR, { recursive: true, force: true });

execSync(`prettier --write ${REST_DIR}`, { stdio: "inherit" });
