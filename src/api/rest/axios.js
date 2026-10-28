import axios from "axios";

import { API_BASE_URL, getApiKey } from "@/config/api";

import { API_ERROR, ApiError, parseApiErrorCode } from "./errors";

/**
 * Общий экземпляр axios: базовый URL сервиса и таймаут 20 с.
 * Перехватчики добавляют ключ покупателя и приводят ошибки к {@link ApiError}.
 * @type {import("axios").AxiosInstance}
 */
export const instance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

// Ключ покупателя нужен в каждом запросе
instance.interceptors.request.use((config) => {
  // config.params = { key: getApiKey(), ...config.params };
  config.params = { key: getApiKey(), ...config.params };
  return config;
});

// Сервис отвечает 200 и при ошибке — описание лежит в теле как { error }
instance.interceptors.response.use(
  (response) => {
    // HTML вместо JSON (например, /api не проксируется) — не «пустая выдача», а ошибка
    if (typeof response.data !== "object" || response.data === null) {
      throw new ApiError(API_ERROR.UNKNOWN, "Unexpected response");
    }
    const error = response.data?.error;
    if (error) throw new ApiError(parseApiErrorCode(error), String(error));
    return response;
  },
  (error) => {
    if (axios.isCancel(error)) throw error;
    const apiMessage = error.response?.data?.error;
    if (apiMessage) throw new ApiError(parseApiErrorCode(apiMessage), String(apiMessage));
    throw new ApiError(error.response ? API_ERROR.UNKNOWN : API_ERROR.NETWORK, error.message);
  },
);

/**
 * Мутатор для orval: orval передаёт готовый axios-конфиг, возвращаем data.
 * @template T
 * @param {import("axios").AxiosRequestConfig} config Конфиг запроса, собранный orval.
 * @param {import("axios").AxiosRequestConfig} [options] Дополнительные опции (например, `signal` для отмены); перекрывают `config`.
 * @returns {Promise<T>} Тело ответа (`response.data`).
 * @throws {import("./errors").ApiError} При ошибке сервиса, сети или неожиданном формате ответа.
 */
export const api = (config, options) => instance({ ...config, ...options }).then(({ data }) => data);
