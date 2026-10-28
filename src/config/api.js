/**
 * Базовый URL сервиса (`VITE_API_URL`).
 * @type {string}
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://api.favorit-parts.ru";

/**
 * Ключ покупателя по умолчанию (`VITE_API_KEY`). Передаётся в каждом запросе.
 * @type {string}
 */
export const API_KEY = import.meta.env.VITE_API_KEY || "";

const KEY_STORAGE = "apiKey";

/**
 * Ключ, который пользователь ввёл в настройках. Пустая строка — осознанно пустой ключ, `null` — ключ не задан.
 * @returns {string | null} Сохранённый ключ или `null` (в том числе когда `localStorage` недоступен).
 */
export const getCustomApiKey = () => {
  try {
    return localStorage.getItem(KEY_STORAGE);
  } catch {
    return null;
  }
};

/**
 * Сохраняет пользовательский ключ в `localStorage`; `null` удаляет его (возврат к ключу по умолчанию).
 * Ошибки хранилища подавляются: ключ тогда действует только до перезагрузки.
 * @param {string | null} value Новый ключ, пустая строка (запросы без ключа) или `null` для сброса.
 * @returns {void}
 */
export const setCustomApiKey = (value) => {
  try {
    if (value === null) localStorage.removeItem(KEY_STORAGE);
    else localStorage.setItem(KEY_STORAGE, value);
  } catch {
    // не критично: ключ действует до перезагрузки страницы
  }
};

/**
 * Ключ для запросов: пользовательский (в том числе пустой), иначе `VITE_API_KEY`.
 * @returns {string}
 */
export const getApiKey = () => getCustomApiKey() ?? API_KEY;
