/**
 * Коды ошибок, которые понимает UI (переводятся через i18n: `search:errors.<code>`).
 */
/**
 * @readonly
 * @enum {string}
 */
export const API_ERROR = {
  EMPTY_KEY: "emptyKey",
  INVALID_KEY: "invalidKey",
  EMPTY_NUMBER: "emptyNumber",
  QUOTA: "quota",
  NETWORK: "network",
  UNKNOWN: "unknown",
};

// Тексты `error` из документации сервиса → код
const MESSAGE_TO_CODE = [
  ["empty key", API_ERROR.EMPTY_KEY],
  ["invalid key", API_ERROR.INVALID_KEY],
  ["invalid access key", API_ERROR.INVALID_KEY],
  ["empty number", API_ERROR.EMPTY_NUMBER],
  ["quota exceeded", API_ERROR.QUOTA],
];

/** Ошибка обращения к API с машиночитаемым кодом для UI. */
export class ApiError extends Error {
  /**
   * @param {API_ERROR} code Код ошибки.
   * @param {string} [message] Текст ошибки; по умолчанию равен `code`.
   */
  constructor(code, message) {
    super(message ?? code);
    this.name = "ApiError";
    /** @type {API_ERROR} */
    this.code = code;
  }
}

/**
 * Определяет код ошибки по тексту `error` из ответа сервиса.
 * Сервис может вернуть несколько ошибок в одной строке — берём первую известную.
 * @param {unknown} message Текст ошибки сервиса (приводится к строке; регистр не важен).
 * @returns {API_ERROR} Код ошибки; `API_ERROR.UNKNOWN`, если текст не распознан.
 */
export const parseApiErrorCode = (message) => {
  const text = String(message ?? "").toLowerCase();
  return MESSAGE_TO_CODE.find(([part]) => text.includes(part))?.[1] ?? API_ERROR.UNKNOWN;
};
