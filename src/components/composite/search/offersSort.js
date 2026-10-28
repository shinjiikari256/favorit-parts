/**
 * @typedef {object} OffersSort
 * @property {"price"|"stock"} field Колонка сортировки.
 * @property {"asc"|"desc"} dir Направление.
 */

/**
 * id предложения с минимальной ценой среди имеющихся в наличии (если такое есть).
 * Если в наличии меньше двух позиций, «лучшего» нет — сравнивать не с чем.
 * @param {Array<import("@/store/search/normalize").Offer>} offers Предложения.
 * @returns {string|null}
 */
export const findBestId = (offers) => {
  const available = offers.filter((o) => o.price !== null && o.stock > 0);
  if (available.length < 2) return null;
  return available.reduce((best, o) => (o.price < best.price ? o : best)).id;
};

/**
 * Клик по колонке: по возрастанию → по убыванию → без сортировки; другая колонка начинает заново.
 * @param {OffersSort|null} sort Текущая сортировка.
 * @param {OffersSort["field"]} field Колонка, по которой кликнули.
 * @returns {OffersSort|null} Новая сортировка; `null` — сортировка выключена.
 */
export const nextSort = (sort, field) => {
  if (sort?.field !== field) return { field, dir: "asc" };
  return sort.dir === "asc" ? { field, dir: "desc" } : null;
};

/**
 * Сортирует предложения (исходный массив не меняется).
 * Позиции без значения (нет цены / остатка) всегда внизу, в любом направлении.
 * @param {Array<import("@/store/search/normalize").Offer>} offers Предложения.
 * @param {OffersSort|null} sort Сортировка; `null` — порядок не меняется.
 * @returns {Array<import("@/store/search/normalize").Offer>}
 */
export const sortOffers = (offers, sort) => {
  if (!sort) return offers;
  const value = (o) => (sort.field === "price" ? o.price : o.stock > 0 ? o.stock : null);
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...offers].sort((a, b) => {
    const [x, y] = [value(a), value(b)];
    if (x === null || y === null) return (x === null) - (y === null);
    return (x - y) * sign;
  });
};
