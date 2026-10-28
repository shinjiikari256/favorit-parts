/** Форматтеры цены по локали: `Intl.NumberFormat` дорого создавать на каждый вызов. */
const priceFormats = new Map();

/**
 * Цена в рублях: 12 533,62 ₽
 * @param {number} value Сумма.
 * @param {string} [locale="ru-RU"] Локаль форматирования.
 * @returns {string}
 */
export const formatPrice = (value, locale = "ru-RU") => {
  if (!priceFormats.has(locale)) {
    priceFormats.set(locale, new Intl.NumberFormat(locale, { style: "currency", currency: "RUB" }));
  }
  return priceFormats.get(locale).format(value);
};
