/**
 * @param {object} state Состояние стора.
 * @returns {string} Текущий нормализованный номер.
 */
export const selectNumber = (state) => state.search.number;

/**
 * @param {object} state Состояние стора.
 * @returns {import("./searchSlice").SearchRequest<import("./normalize").Brand>} Запрос производителей.
 */
export const selectBrands = (state) => state.search.brands;

/**
 * @param {object} state Состояние стора.
 * @returns {string|null} Выбранный производитель.
 */
export const selectSelectedBrand = (state) => state.search.selectedBrand;

/**
 * @param {object} state Состояние стора.
 * @returns {import("./searchSlice").SearchRequest<import("./normalize").Offer>} Запрос предложений.
 */
export const selectOffers = (state) => state.search.offers;
