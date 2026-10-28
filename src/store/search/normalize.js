/** @typedef {import("@/api/rest/endpoints/price/price").PricelistGoods} PricelistGoods */
/** @typedef {import("@/api/rest/endpoints/price/price").PricelistResponse} PricelistResponse */

/**
 * @typedef {object} Brand Производитель на этапе выбора.
 * @property {string} id Идентификатор товара этого производителя.
 * @property {string} brand Название производителя.
 * @property {string} number Артикул.
 * @property {string} name Название детали.
 */

/**
 * @typedef {object} OfferWarehouse Склад с остатком.
 * @property {string|number} id Идентификатор склада.
 * @property {string|null} code Код склада.
 * @property {boolean} own Склад поставщика.
 * @property {number|null} price Цена, ₽; `null` — цена не указана.
 * @property {number} stock Остаток (> 0).
 * @property {string|null} shipmentDate Дата отгрузки.
 */

/**
 * @typedef {object} Offer Предложение: искомая деталь или аналог.
 * @property {string} id Идентификатор товара.
 * @property {string} brand Производитель.
 * @property {string} number Артикул.
 * @property {string} name Название.
 * @property {number|null} price Минимальная цена среди складов в наличии; `null` — нет в наличии.
 * @property {number} stock Суммарный остаток.
 * @property {OfferWarehouse[]} warehouses Склады с остатком, от дешёвого к дорогому.
 * @property {boolean} isOrigin `true` — искомая деталь, `false` — аналог.
 */

const ZERO_ID = /^[0-]*$/;

/**
 * Сервис вместо «не найдено» возвращает один элемент с пустой структурой
 * (brand: "", goodsID из нулей, count: 0).
 * @param {PricelistGoods|undefined} goods Элемент ответа.
 * @returns {boolean} `true`, если элемента нет или он «пустой».
 */
export const isEmptyGoods = (goods) => !goods || (!goods.brand && ZERO_ID.test(goods.goodsID ?? ""));

/**
 * Цену верхнего уровня (goods.price) использовать нельзя — берём минимальную среди складов,
 * где товар есть в наличии. Нет таких складов — `null` (в UI «нет в наличии»).
 * @param {PricelistGoods} goods Товар из ответа.
 * @returns {number|null}
 */
export const getGoodsPrice = (goods) => {
  const prices = (goods.warehouses ?? []).filter((w) => w.stock > 0 && w.price > 0).map((w) => w.price);
  return prices.length ? Math.min(...prices) : null;
};

/**
 * Склады с остатком, от дешёвого к дорогому (без цены — в конец).
 * @param {PricelistGoods} goods Товар из ответа.
 * @returns {OfferWarehouse[]}
 */
export const getOfferWarehouses = (goods) =>
  (goods.warehouses ?? [])
    .filter((w) => w.stock > 0)
    .map((w) => ({
      id: w.id,
      code: w.code ?? null,
      own: Boolean(w.own),
      price: w.price > 0 ? w.price : null,
      stock: w.stock,
      shipmentDate: w.shipmentDate ?? null,
    }))
    .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));

/**
 * @param {PricelistGoods} goods Товар из ответа.
 * @param {boolean} isOrigin Искомая деталь (а не аналог).
 * @returns {Offer}
 */
const toOffer = (goods, isOrigin) => ({
  id: goods.goodsID,
  brand: goods.brand,
  number: goods.number,
  name: goods.name,
  price: getGoodsPrice(goods),
  stock: goods.count ?? 0,
  warehouses: getOfferWarehouses(goods),
  isOrigin,
});

/**
 * Список производителей, у которых есть деталь с таким номером (без пустых и повторов).
 * @param {PricelistResponse|undefined} response Ответ сервиса.
 * @returns {Brand[]}
 */
export const normalizeBrands = (response) => {
  const seen = new Set();
  const brands = [];
  for (const goods of response?.goods ?? []) {
    if (isEmptyGoods(goods) || seen.has(goods.brand)) continue;
    seen.add(goods.brand);
    brands.push({ id: goods.goodsID, brand: goods.brand, number: goods.number, name: goods.name });
  }
  return brands;
};

/**
 * Искомая деталь (первой) и её аналоги.
 * @param {PricelistResponse|undefined} response Ответ сервиса.
 * @returns {Offer[]} Пустой массив, если деталь не найдена.
 */
export const normalizeOffers = (response) => {
  const [origin] = response?.goods ?? [];
  if (isEmptyGoods(origin)) return [];
  const analogues = (origin.analogues ?? []).filter((goods) => !isEmptyGoods(goods));
  return [toOffer(origin, true), ...analogues.map((goods) => toOffer(goods, false))];
};
