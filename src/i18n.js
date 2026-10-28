import { initReactI18next } from "react-i18next";

import i18n from "i18next";
import yaml from "yaml";

import { DEFAULT_LANGUAGE } from "./utils/language";

// Все переводы вшиты в бандл: src/locales/<язык>/<namespace>.yaml
const files = import.meta.glob("./locales/*/*.yaml", { eager: true, query: "?raw", import: "default" });

/** @type {Record<string, Record<string, object>>} Переводы: язык → namespace → плоские ключи. */
const resources = {};
for (const [path, raw] of Object.entries(files)) {
  const [, lng, ns] = path.match(/\/locales\/([^/]+)\/([^/]+)\.yaml$/);
  (resources[lng] ??= {})[ns] = yaml.parse(raw);
}

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: "ru",
  ns: ["common", "search"],
  defaultNS: "common",
  keySeparator: false, // ключи в YAML плоские: "settings.apiKey: …"
  interpolation: { escapeValue: false },
  react: { useSuspense: true },
});

export default i18n;
