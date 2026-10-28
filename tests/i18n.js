import { initReactI18next } from "react-i18next";

import i18n from "i18next";
import yaml from "yaml";

import commonRu from "../src/locales/ru/common.yaml?raw";
import searchRu from "../src/locales/ru/search.yaml?raw";

/** i18n для тестов: русские переводы из yaml без http-backend. */
i18n.use(initReactI18next).init({
  lng: "ru",
  fallbackLng: "ru",
  ns: ["common", "search"],
  defaultNS: "common",
  resources: { ru: { common: yaml.parse(commonRu), search: yaml.parse(searchRu) } },
  keySeparator: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
