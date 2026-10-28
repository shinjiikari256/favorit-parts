import { api } from "../../axios.js";

/**
 * @typedef {object} PricelistParams
 * @property {string} number Артикул детали.
 * @property {string} [brand] Производитель; без него возвращаются варианты по всем производителям.
 * @property {"on"} [analogues] `"on"` — вернуть также аналоги.
 */

/**
 * @typedef {object} PricelistWarehouse
 * @property {string|number} id Идентификатор склада.
 * @property {string} [code] Код склада.
 * @property {boolean} [own] Склад поставщика.
 * @property {number} price Цена, ₽ (0 — цена не указана).
 * @property {number} stock Остаток на складе.
 * @property {string} [shipmentDate] Дата отгрузки.
 */

/**
 * @typedef {object} PricelistGoods
 * @property {string} goodsID Идентификатор товара (из нулей, если ничего не найдено).
 * @property {string} brand Производитель.
 * @property {string} number Артикул.
 * @property {string} name Название.
 * @property {number} [count] Суммарный остаток.
 * @property {PricelistWarehouse[]} [warehouses] Склады.
 * @property {PricelistGoods[]} [analogues] Аналоги (только для искомой детали).
 */

/**
 * @typedef {object} PricelistResponse
 * @property {PricelistGoods[]} goods Найденные товары.
 */

/**
 * Фабрика методов раздела «прайс-лист» API.
 * @returns {{ pricelistGet: (params: PricelistParams, options?: import("axios").AxiosRequestConfig) => Promise<PricelistResponse> }}
 */
const getPrice = () => {
  /**
   * Запрос прайс-листа: без `brand` — список производителей, с `brand` — деталь и (при `analogues`) аналоги.
   * @param {PricelistParams} params Query-параметры запроса (ключ добавляется перехватчиком).
   * @param {import("axios").AxiosRequestConfig} [options] Опции axios, например `signal`.
   * @returns {Promise<PricelistResponse>}
   */
  const pricelistGet = (params, options) => {
    return api({ url: `/hs/hsprice/`, method: "GET", params }, options);
  };
  return { pricelistGet };
};
export { getPrice };
