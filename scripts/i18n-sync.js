/// <reference types="node" />
/**
 * Утилита синхронизации переводов.
 *
 * Показывает статус переводов по модулям, список отсутствующих ключей
 * и предлагает добавить переводы через AI.
 *
 * Использование:
 *   node scripts/i18n-sync.js [опции]
 *
 * Опции:
 *   -b, --branch <ветка>    Base-ветка для сравнения (по умолчанию: master)
 *   -l, --lang   <код>      Только указанный язык (можно несколько: -l en -l de)
 *   -m, --module <модуль>   Только указанный модуль (можно несколько: -m orders -m cart)
 *   -a, --all               Проверять все ключи ru, а не только изменения в текущей ветке
 *   -c, --check             Только проверка: статус + список пропусков, без перевода
 *   -h, --help              Показать справку и выйти
 *
 * Переменные окружения:
 *   AI_API_KEY    Ключ API для перевода
 *   AI_API_BASE   Базовый URL API
 */
import * as clack from "@clack/prompts";
import fs from "fs";
import minimist from "minimist";
import path from "path";
import simpleGit from "simple-git";
import { fileURLToPath } from "url";

import { loadEnv } from "./load-env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

loadEnv(ROOT);

const args = minimist(process.argv.slice(2), {
  boolean: ["all", "check", "dead", "help"],
  alias: { b: "branch", l: "lang", m: "module", a: "all", c: "check", d: "dead", h: "help" },
});

if (args.help) {
  clack.intro("i18n:sync — синхронизация переводов");

  clack.note(
    [
      "-b, --branch <ветка>    base-ветка для сравнения (по умолчанию: master)",
      "-l, --lang   <код>      только указанный язык, можно несколько",
      "-m, --module <модуль>   только указанный модуль, можно несколько",
      "-a, --all               все ключи ru/, а не только diff ветки",
      "-c, --check             только проверка, без перевода",
      "-d, --dead              проверить мёртвые ключи (не используются в src/)",
      "-h, --help              показать справку",
    ].join("\n"),
    "Опции",
  );

  clack.note(
    [
      "node scripts/i18n-sync.js              синхронизация diff текущей ветки",
      "node scripts/i18n-sync.js -a           все ключи ru/",
      "node scripts/i18n-sync.js -c -a        только проверка всех ключей",
      "node scripts/i18n-sync.js -l en -l de  только английский и немецкий",
      "node scripts/i18n-sync.js -m orders    только модуль orders",
      "node scripts/i18n-sync.js -b develop   сравнивать с develop",
    ].join("\n"),
    "Примеры",
  );

  clack.note(
    ["AI_API_KEY    ключ API для перевода", "AI_API_BASE   базовый URL API"].join("\n"),
    "Переменные окружения",
  );

  process.exit(0);
}

const BASE_BRANCH = args.branch ?? "master";
const CHECK_ALL = args.all ?? false;
const CHECK_ONLY = args.check ?? false;
const DEAD_CHECK = args.dead ?? false;

// Конфиг игнорирования: .i18n-sync.json в корне проекта
const SYNC_CONFIG_PATH = path.join(ROOT, ".i18n-sync.json");
const SYNC_CONFIG = fs.existsSync(SYNC_CONFIG_PATH) ? JSON.parse(fs.readFileSync(SYNC_CONFIG_PATH, "utf8")) : {};
const IGNORE_MODULES = new Set(SYNC_CONFIG.ignore?.modules ?? []);
const IGNORE_KEYS = new Set(SYNC_CONFIG.ignore?.keys ?? []);
const LOCALES_DIR = path.join(ROOT, "src/locales");
const RU_DIR = path.join(LOCALES_DIR, "ru");

const TARGET_LANGS_ARG = args.lang ? (Array.isArray(args.lang) ? args.lang : [args.lang]) : null;
const TARGET_MODULES_ARG = args.module ? (Array.isArray(args.module) ? args.module : [args.module]) : null;

const API_KEY = process.env.AI_API_KEY;
const API_BASE = process.env.AI_API_BASE;

const PRESET_MODELS = [
  {
    value: "deepseek/deepseek-v4-flash",
    label: "DeepSeek V4 Flash",
    hint: "вход 9 ₽/1M · выход 18 ₽/1M — самый дешёвый",
  },
  {
    value: "google/gemini-2.5-flash-lite-preview-09-2025",
    label: "Gemini 2.5 Flash Lite",
    hint: "вход 10 ₽/1M · выход 40 ₽/1M",
  },
  {
    value: "openai/gpt-4o-mini",
    label: "GPT-4o-mini",
    hint: "вход 15 ₽/1M · выход 60 ₽/1M — надёжное следование инструкциям",
  },
  {
    value: "deepseek/deepseek-v3-2",
    label: "DeepSeek V3.2",
    hint: "вход 22 ₽/1M · выход 34 ₽/1M — проверенное качество",
  },
  {
    value: "custom",
    label: "Указать свою",
    hint: "ввести идентификатор модели вручную",
  },
];

const LANG_NAMES = {
  en: "English",
  be: "Belarusian (Беларуская)",
  de: "German (Deutsch)",
  pl: "Polish (Polski)",
  ro: "Romanian (Română)",
  uk: "Ukrainian (Українська)",
};

// ─── Парсинг flat-YAML ────────────────────────────────────────────────────────

function parseYaml(filePath) {
  if (!fs.existsSync(filePath)) return new Map();
  const lines = fs.readFileSync(filePath, "utf8").split("\n");
  const entries = new Map();
  for (const line of lines) {
    const match = line.match(/^([^\s#][^:]*?):\s+(.+)$|^([^\s#][^:]*?):\s*(".*?"|'.*?')$/);
    if (!match) continue;
    const key = (match[1] ?? match[3]).trim();
    const value = (match[2] ?? match[4]).trim();
    entries.set(key, value);
  }
  return entries;
}

/**
 * Вставляет строку `ключ: значение` рядом с ключами той же группы (общий префикс).
 */
function insertKeyIntoFile(filePath, key, value) {
  const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
  const lines = content.split("\n");
  const prefix = key.split(".").slice(0, -1).join(".");
  let insertAt = -1;

  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].startsWith(prefix + ".") || lines[i].startsWith(prefix + ":")) {
      insertAt = i;
      break;
    }
  }

  const newLine = `${key}: ${value}`;
  if (insertAt === -1) {
    let end = lines.length - 1;
    while (end > 0 && lines[end].trim() === "") end--;
    lines.splice(end + 1, 0, newLine);
  } else {
    lines.splice(insertAt + 1, 0, newLine);
  }

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

// ─── Git diff ────────────────────────────────────────────────────────────────

/**
 * Разбирает unified diff и возвращает { added: Map<key,value>, removed: Set<key> }.
 */
function parseDiff(diff) {
  const added = new Map();
  const removed = new Set();
  for (const line of diff.split("\n")) {
    if (
      line.startsWith("+++") ||
      line.startsWith("---") ||
      line.startsWith("diff") ||
      line.startsWith("index") ||
      line.startsWith("@@")
    )
      continue;
    const isAdded = line.startsWith("+");
    const isRemoved = line.startsWith("-");
    if (!isAdded && !isRemoved) continue;
    const content = line.slice(1);
    const match = content.match(/^([^\s#][^:]*?):\s+(.+)$|^([^\s#][^:]*?):\s*(".*?"|'.*?')$/);
    if (!match) continue;
    const key = (match[1] ?? match[3]).trim();
    const value = (match[2] ?? match[4]).trim();
    if (isAdded) added.set(key, value);
    else removed.add(key);
  }
  return { added, removed };
}

async function getChangedRuKeys() {
  const git = simpleGit(ROOT);
  const SCOPE = ["--", "src/locales/ru/"];

  // Committed изменения ветки относительно base-ветки
  const committedDiff = await git.diff([`${BASE_BRANCH}...HEAD`, ...SCOPE]);
  // Staged (индекс vs HEAD)
  const stagedDiff = await git.diff(["--cached", ...SCOPE]);
  // Unstaged (рабочее дерево vs индекс)
  const unstagedDiff = await git.diff([...SCOPE]);

  // Мержим: uncommitted-изменения перекрывают committed
  const merged = new Map(); // key → { value, wasRemoved }
  for (const diff of [committedDiff, stagedDiff, unstagedDiff]) {
    const { added, removed } = parseDiff(diff);
    for (const [key, value] of added) merged.set(key, { value, wasRemoved: false });
    for (const key of removed) {
      if (!merged.has(key)) merged.set(key, { value: null, wasRemoved: true });
    }
  }

  const newKeys = new Map();
  const modifiedKeys = new Map();
  // Ключи, которые есть в committed-базе (до изменений ветки), считаются модифицированными
  const { removed: committedRemoved } = parseDiff(committedDiff);
  for (const [key, { value, wasRemoved }] of merged) {
    if (wasRemoved || value === null) continue;
    if (committedRemoved.has(key)) modifiedKeys.set(key, value);
    else newKeys.set(key, value);
  }

  return { newKeys, modifiedKeys };
}

function getAllRuKeys() {
  const all = new Map();
  for (const file of fs.readdirSync(RU_DIR).filter((f) => f.endsWith(".yaml"))) {
    for (const [key, value] of parseYaml(path.join(RU_DIR, file))) {
      all.set(key, value);
    }
  }
  return all;
}

function buildKeyToNsMap() {
  const map = new Map();
  for (const file of fs.readdirSync(RU_DIR).filter((f) => f.endsWith(".yaml"))) {
    const ns = file.replace(".yaml", "");
    for (const [key] of parseYaml(path.join(RU_DIR, file))) {
      map.set(key, ns);
    }
  }
  return map;
}

// ─── Мёртвые ключи ────────────────────────────────────────────────────────────

const SRC_DIR = path.join(__dirname, "../src");

/**
 * Рекурсивно собирает все файлы с указанными расширениями.
 */
function walkFiles(dir, exts) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, exts));
    } else if (exts.some((e) => entry.name.endsWith(e))) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Собирает все строковые литералы из src/ (одинарные и двойные кавычки).
 * Этого достаточно, чтобы поймать ключи в переменных, объектах и массивах —
 * не только прямые t("key") вызовы.
 */
function collectUsedKeys() {
  const used = new Set();
  // Строковые литералы: "text" или 'text', не пересекающие строку
  const re = /["']([^"'\n\\]{1,200})["']/g;
  for (const file of walkFiles(SRC_DIR, [".ts", ".tsx", ".js", ".jsx"])) {
    const content = fs.readFileSync(file, "utf8");
    for (const [, s] of content.matchAll(re)) used.add(s);
  }
  return used;
}

/**
 * Возвращает Map<ns, entry[]> — ключи в YAML-файлах, не найденные в src/.
 * Plural-формы группируются: ключ считается живым, если хотя бы одна форма
 * встречается в src/ как строковый литерал.
 */
function collectDeadKeys() {
  const used = collectUsedKeys();

  // Проверяет ключ как bare-строку и как "ns:key" (i18n.t("ns:key"))
  const isUsed = (ns, key) => used.has(key) || used.has(`${ns}:${key}`);

  const dead = new Map();
  for (const file of fs.readdirSync(RU_DIR).filter((f) => f.endsWith(".yaml"))) {
    const ns = file.replace(".yaml", "");
    if (IGNORE_MODULES.has(ns)) continue;

    const keys = parseYaml(path.join(RU_DIR, file));

    // Группируем по базовым ключам (для plural)
    const baseGroups = new Map();
    for (const [key] of keys) {
      const base = pluralBase(key) ?? key;
      if (!baseGroups.has(base)) baseGroups.set(base, []);
      baseGroups.get(base).push(key);
    }

    const deadInNs = [];
    for (const [base, forms] of baseGroups) {
      if (IGNORE_KEYS.has(base) || IGNORE_KEYS.has(`${ns}.${base}`)) continue;
      const anyUsed = forms.some((k) => isUsed(ns, k)) || isUsed(ns, base);
      if (!anyUsed) {
        const isPlural = forms.some((k) => pluralBase(k) !== null);
        deadInNs.push({ key: base, isPlural, ruText: keys.get(forms[0]) ?? "" });
      }
    }

    if (deadInNs.length > 0) dead.set(ns, deadInNs);
  }

  return dead;
}

/**
 * Удаляет ключи из всех YAML-файлов во всех языках.
 * dead: Map<ns, {key, isPlural}[]>
 */
function removeDeadKeys(dead) {
  const langs = [
    "ru",
    ...fs.readdirSync(LOCALES_DIR).filter((l) => l !== "ru" && fs.statSync(path.join(LOCALES_DIR, l)).isDirectory()),
  ];
  for (const [ns, entries] of dead) {
    for (const lang of langs) {
      const filePath = path.join(LOCALES_DIR, lang, `${ns}.yaml`);
      if (!fs.existsSync(filePath)) continue;
      let content = fs.readFileSync(filePath, "utf8");
      for (const { key, isPlural } of entries) {
        if (isPlural) {
          // Удаляем все plural-формы
          for (const s of ["", ...PLURAL_SUFFIXES]) {
            const k = s ? `${key}${s}` : key;
            content = content.replace(new RegExp(`^${k}:.*\\n`, "m"), "");
          }
        } else {
          content = content.replace(new RegExp(`^${key}:.*\\n`, "m"), "");
        }
      }
      fs.writeFileSync(filePath, content, "utf8");
    }
  }
}

// ─── Plural-ключи ─────────────────────────────────────────────────────────────

const PLURAL_SUFFIXES = ["_one", "_few", "_many", "_other"];

/** Возвращает базовый ключ без plural-суффикса, или null если ключ не plural */
function pluralBase(key) {
  for (const s of PLURAL_SUFFIXES) {
    if (key.endsWith(s)) return key.slice(0, -s.length);
  }
  return null;
}

/**
 * Считает ключ покрытым если в целевом языке есть хотя бы одна plural-форма
 * с тем же основанием (или точное совпадение для не-plural ключей).
 */
function isCovered(ruKey, targetKeys) {
  const base = pluralBase(ruKey);
  if (!base) return targetKeys.has(ruKey);
  return PLURAL_SUFFIXES.some((s) => targetKeys.has(base + s));
}

// ─── Сбор отсутствующих ключей ────────────────────────────────────────────────

/**
 * Группирует plural-ключи по базовому, возвращает только непокрытые группы.
 * @param {Map<string, string>} scopeKeys ключи для проверки (key → ruText)
 * @param {string[]} langs
 * @returns {Map<string, { key: string, ruText: string, ruForms: Map<string,string>, missingIn: string[] }[]>}
 */
function collectMissing(scopeKeys, langs) {
  const keyToNs = buildKeyToNsMap();

  const byNs = new Map();
  for (const [key, value] of scopeKeys) {
    const ns = keyToNs.get(key);
    if (!ns) continue;
    if (!byNs.has(ns)) byNs.set(ns, new Map());
    byNs.get(ns).set(key, value);
  }

  const result = new Map();
  for (const [ns, nsKeys] of byNs) {
    // Группируем по логическому ключу: plural-формы объединяются по базе
    const groups = new Map(); // logicalKey → { ruText, ruForms }
    for (const [key, value] of nsKeys) {
      const logical = pluralBase(key) ?? key;
      if (!groups.has(logical)) groups.set(logical, { ruText: value, ruForms: new Map() });
      groups.get(logical).ruForms.set(key, value);
      // Предпочитаем _many/_other как представительный текст
      if (key.endsWith("_many") || key.endsWith("_other")) groups.get(logical).ruText = value;
    }

    const entries = [];
    for (const [logical, { ruText, ruForms }] of groups) {
      const missingIn = langs.filter((lang) => {
        const existing = parseYaml(path.join(LOCALES_DIR, lang, `${ns}.yaml`));
        return ![...ruForms.keys()].some((k) => isCovered(k, existing));
      });
      if (missingIn.length > 0) entries.push({ key: logical, ruText, ruForms, missingIn });
    }
    if (entries.length > 0) result.set(ns, entries);
  }

  return result;
}

// ─── Перевод через OpenAI-совместимый API ─────────────────────────────────────

/**
 * @param {Map<string, string>} keys key → ruText
 * @param {string} lang
 * @param {string} ns
 * @returns {Promise<Map<string, string>>}
 */
async function translateKeys(keys, lang, ns, model) {
  if (!API_KEY || !API_BASE) throw new Error("AI_API_KEY или AI_API_BASE не задан");
  if (keys.size === 0) return new Map();

  const langName = LANG_NAMES[lang] ?? lang;
  const keysList = [...keys.entries()].map(([k, v]) => `${k}: ${v}`).join("\n");

  const prompt = `Переведи следующие i18next ключи локализации с русского на ${langName}.

Правила:
- Сохраняй плейсхолдеры {{variable}} без изменений
- Ключи с суффиксами _one/_few/_many — plural-формы русского. Для ${langName} используй нужные plural-формы языка
- Если в оригинале значение в кавычках — сохраняй кавычки в переводе
- Возвращай ТОЛЬКО строки формата "ключ: перевод", по одной на строку, без комментариев и объяснений

Namespace: ${ns}
Ключи:
${keysList}`;

  const response = await fetch(`${API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      reasoning: false, // отключаем reasoning — для перевода не нужен, экономит токены
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content;

  const translated = new Map();
  for (const line of text.split("\n")) {
    const match = line.match(/^([^\s:][^:]*?):\s+(.+)$|^([^\s:][^:]*?):\s*(".*?"|'.*?')$/);
    if (!match) continue;
    const key = (match[1] ?? match[3]).trim();
    const value = (match[2] ?? match[4]).trim();
    if (keys.has(key)) translated.set(key, value);
  }

  return translated;
}

// ─── ANSI-цвета ───────────────────────────────────────────────────────────────

const A = {
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
};

/** Оборачивает уже выровненную строку в цвет (ANSI не влияет на padEnd). */
const colorize = (s, color) => color + s + A.reset;

// ─── Таблица статусов ────────────────────────────────────────────────────────

/**
 * Рендерит таблицу: строки — namespace, столбцы — языки.
 * Ячейка: количество покрытых ключей, цвет — зелёный/жёлтый/красный.
 * @param {string[]} langs включая "ru"
 */
function renderStatusTable(langs) {
  const namespaces = fs
    .readdirSync(RU_DIR)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.replace(".yaml", ""))
    .sort();

  // Возвращает { raw, color } — raw используется для выравнивания, color — для вывода
  const cellData = (lang, ns) => {
    const ruKeys = parseYaml(path.join(RU_DIR, `${ns}.yaml`));
    const uniqueKeys = [...new Set([...ruKeys.keys()].map((k) => pluralBase(k) ?? k))];
    const total = uniqueKeys.length;

    const existing = parseYaml(path.join(LOCALES_DIR, lang, `${ns}.yaml`));
    const present = uniqueKeys.filter((base) => {
      const forms = [...ruKeys.keys()].filter((k) => (pluralBase(k) ?? k) === base);
      return forms.some((k) => isCovered(k, existing));
    }).length;

    const raw = total === 0 ? "-" : `${present}/${total}`;
    const color = present === 0 ? A.red : present < total ? A.yellow : A.dim;
    return { raw, color };
  };

  const pad = (s, w) => s.padEnd(w);
  const SEP = "  ";
  const NS_W = Math.max(...namespaces.map((ns) => ns.length));
  // Ширины считаем по raw-строкам (без ANSI)
  const colWidths = langs.map((lang) =>
    Math.max(lang.length, ...namespaces.map((ns) => cellData(lang, ns).raw.length)),
  );

  const header = pad("", NS_W) + SEP + langs.map((lang, i) => colorize(pad(lang, colWidths[i]), A.bold)).join(SEP);
  const rows = namespaces.map((ns) => {
    const cells = langs.map((lang, i) => {
      const { raw, color } = cellData(lang, ns);
      return colorize(pad(raw, colWidths[i]), color);
    });
    return colorize(pad(ns, NS_W), A.dim) + SEP + cells.join(SEP);
  });

  return [header, ...rows].join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  clack.intro("Синхронизация переводов");

  const allLangs = fs
    .readdirSync(LOCALES_DIR)
    .filter((l) => l !== "ru" && fs.statSync(path.join(LOCALES_DIR, l)).isDirectory())
    .sort();
  const targetLangs = TARGET_LANGS_ARG ? allLangs.filter((l) => TARGET_LANGS_ARG.includes(l)) : allLangs;
  const tableLangs = ["ru", ...targetLangs];

  const allModules = fs
    .readdirSync(RU_DIR)
    .filter((f) => f.endsWith(".yaml"))
    .map((f) => f.replace(".yaml", ""))
    .sort();
  const targetModules = TARGET_MODULES_ARG ? allModules.filter((m) => TARGET_MODULES_ARG.includes(m)) : null;

  // 1. Статус по модулям
  clack.note(renderStatusTable(tableLangs), "Статус");

  // 2. Мёртвые ключи (только при флаге -d / --dead)
  if (DEAD_CHECK) {
    const dead = collectDeadKeys();
    if (dead.size > 0) {
      const totalDead = [...dead.values()].reduce((s, e) => s + e.length, 0);
      const KEY_W = Math.max(
        ...[...dead.values()].flat().map(({ key, isPlural }) => (isPlural ? `${key}_#` : key).length),
      );

      const deadLines = [];
      for (const [ns, entries] of dead) {
        if (deadLines.length > 0) deadLines.push("");
        deadLines.push(colorize(`${ns} (${entries.length})`, A.bold));
        for (const { key, isPlural, ruText } of entries) {
          const displayKey = isPlural ? `${key}_#` : key;
          deadLines.push(`  ${colorize(displayKey.padEnd(KEY_W), A.dim)}  ${colorize(`"${ruText}"`, A.dim)}`);
        }
      }

      clack.note(deadLines.join("\n"), `Мёртвые ключи (${totalDead})`);

      if (!CHECK_ONLY) {
        const deleteAction = await clack.select({
          message: "Удалить мёртвые ключи из всех YAML-файлов?",
          options: [
            { value: "none", label: "Не удалять" },
            { value: "all", label: "Удалить все", hint: `${totalDead} ключей` },
            { value: "pick", label: "Выбрать по модулям" },
          ],
        });
        if (clack.isCancel(deleteAction) || deleteAction === "none") {
          // продолжаем без удаления
        } else {
          const toDelete = new Map();

          if (deleteAction === "all") {
            for (const [ns, entries] of dead) toDelete.set(ns, entries);
          } else {
            // Выбор ключей по каждому модулю
            for (const [ns, entries] of dead) {
              const choices = entries.map(({ key, isPlural, ruText }) => ({
                value: key,
                label: isPlural ? `${key}_#` : key,
                hint: ruText,
              }));

              const action = await clack.select({
                message: `Модуль ${colorize(ns, A.bold)}:`,
                options: [
                  { value: "all", label: "Все", hint: `${entries.length} ключей` },
                  { value: "pick", label: "Выбрать вручную" },
                  { value: "none", label: "Пропустить" },
                ],
              });
              if (clack.isCancel(action) || action === "none") continue;

              let selected;
              if (action === "all") {
                selected = entries;
              } else {
                const picked = await clack.multiselect({
                  message: `${ns}: отметьте ключи`,
                  options: choices,
                  required: false,
                });
                if (clack.isCancel(picked)) continue;
                selected = entries.filter(({ key }) => picked.includes(key));
              }

              if (selected.length > 0) toDelete.set(ns, selected);
            }
          }

          if (toDelete.size > 0) {
            const count = [...toDelete.values()].reduce((s, e) => s + e.length, 0);
            removeDeadKeys(toDelete);
            clack.log.success(`Удалено ${count} ключей`);
          } else {
            clack.log.info("Ничего не выбрано");
          }
        }
      }
    }
  } // end DEAD_CHECK

  // 3. Определяем scope ключей для проверки
  let scopeKeys;
  if (CHECK_ALL) {
    scopeKeys = getAllRuKeys();
    clack.log.info(`Режим: все ключи ru (${scopeKeys.size})`);
  } else {
    clack.log.info(`Режим: diff относительно ${BASE_BRANCH} (включая незакоммиченные изменения)`);
    const { newKeys, modifiedKeys } = await getChangedRuKeys();
    if (newKeys.size > 0) clack.log.success(`Новые ключи: ${newKeys.size} (${[...newKeys.keys()].join(", ")})`);
    if (modifiedKeys.size > 0)
      clack.log.warn(`Изменённые: ${modifiedKeys.size} (${[...modifiedKeys.keys()].join(", ")})`);
    scopeKeys = new Map([...newKeys, ...modifiedKeys]);
  }

  // 4. Список отсутствующих
  const missingAll = collectMissing(scopeKeys, targetLangs);
  const missing = targetModules ? new Map([...missingAll].filter(([ns]) => targetModules.includes(ns))) : missingAll;

  if (missing.size === 0) {
    clack.outro("Все переводы на месте ✓");
    return;
  }

  // Собираем все строки в одну таблицу — единый KEY_W по всем namespace
  const allRows = [];
  for (const [, entries] of missing) {
    for (const { key, ruText, ruForms, missingIn } of entries) {
      const isPlural = [...ruForms.keys()].some((k) => pluralBase(k) !== null);
      // Ключ уже содержит namespace-префикс (flat YAML: stores.table.edit в stores.yaml)
      const displayKey = isPlural ? `${key}_#` : key;
      allRows.push({ displayKey, ruText, missingIn });
    }
  }

  const pad = (s, w) => s.padEnd(w);
  const SEP = "  ";
  const KEY_W = Math.max(4, ...allRows.map((r) => r.displayKey.length));
  const LANG_W = 2;

  const missingLines = [
    colorize(pad("ключ", KEY_W), A.bold) +
      SEP +
      targetLangs.map((l) => colorize(pad(l, LANG_W), A.bold)).join(SEP) +
      SEP +
      colorize("текст", A.bold),
    ...allRows.map(({ displayKey, ruText, missingIn }) => {
      const langCols = targetLangs
        .map((l) => (missingIn.includes(l) ? colorize(pad("✗", LANG_W), A.red) : colorize(pad("✓", LANG_W), A.green)))
        .join(SEP);
      return colorize(pad(displayKey, KEY_W), A.dim) + SEP + langCols + SEP + colorize(`"${ruText}"`, A.dim);
    }),
  ];

  clack.note(missingLines.join("\n"), "Отсутствующие переводы");

  // 4. Режим только проверки — выходим без перевода
  if (CHECK_ONLY) {
    clack.outro("Проверка завершена: есть непереведённые ключи");
    process.exitCode = 1;
    return;
  }

  if (!API_KEY) {
    clack.log.warn("AI_API_KEY не задан — автоперевод недоступен");
    clack.outro("Готово");
    return;
  }

  const action = await clack.select({
    message: "Добавить переводы?",
    options: [
      { value: "no", label: "Нет" },
      { value: "all", label: "Да, все" },
      { value: "select", label: "Выбрать модуль и язык" },
    ],
  });

  if (clack.isCancel(action) || action === "no") {
    clack.outro("Без изменений");
    return;
  }

  let selectedNs;
  let selectedLangs;

  if (action === "select") {
    selectedNs = await clack.multiselect({
      message: "Модули:",
      options: [...missing.keys()].map((ns) => ({ value: ns, label: ns })),
    });
    if (clack.isCancel(selectedNs)) {
      clack.outro("Без изменений");
      return;
    }

    selectedLangs = await clack.multiselect({
      message: "Языки:",
      options: targetLangs.map((l) => ({ value: l, label: `${l} — ${LANG_NAMES[l] ?? l}` })),
    });
    if (clack.isCancel(selectedLangs)) {
      clack.outro("Без изменений");
      return;
    }
  } else {
    selectedNs = [...missing.keys()];
    selectedLangs = targetLangs;
  }

  // 5. Выбор модели
  const modelChoice = await clack.select({
    message: "Модель:",
    options: PRESET_MODELS,
  });
  if (clack.isCancel(modelChoice)) {
    clack.outro("Без изменений");
    return;
  }

  let model;
  if (modelChoice === "custom") {
    const customModel = await clack.text({ message: "Идентификатор модели:" });
    if (clack.isCancel(customModel)) {
      clack.outro("Без изменений");
      return;
    }
    model = customModel;
  } else {
    model = modelChoice;
  }

  // 6. Перевод
  const errors = [];
  for (const ns of selectedNs) {
    const entries = missing.get(ns) ?? [];
    for (const lang of selectedLangs) {
      // Для перевода используем все plural-формы из ruForms, а не только базовый ключ
      const toTranslate = new Map(
        entries.filter(({ missingIn }) => missingIn.includes(lang)).flatMap(({ ruForms }) => [...ruForms]),
      );
      if (toTranslate.size === 0) continue;

      const spinner = clack.spinner();
      spinner.start(`${lang} ${ns} — перевожу ${toTranslate.size}...`);
      try {
        const translated = await translateKeys(toTranslate, lang, ns, model);
        const filePath = path.join(LOCALES_DIR, lang, `${ns}.yaml`);
        for (const [key, value] of translated) insertKeyIntoFile(filePath, key, value);
        spinner.stop(`${lang} ${ns} — добавлено ${translated.size}/${toTranslate.size}`);

        const untranslated = [...toTranslate.keys()].filter((k) => !translated.has(k));
        if (untranslated.length > 0) errors.push(`${lang} ${ns}: не переведено — ${untranslated.join(", ")}`);
      } catch (e) {
        spinner.stop(`${lang} ${ns} — ошибка`);
        errors.push(`${lang} ${ns}: ${e.message}`);
      }
    }
  }

  for (const e of errors) clack.log.error(e);

  // 6. Итоговый статус
  clack.note(renderStatusTable(tableLangs), "Итог");

  clack.outro("Готово!");
}

main().catch((e) => {
  clack.log.error(`Критическая ошибка: ${e.message}`);
  process.exit(1);
});
