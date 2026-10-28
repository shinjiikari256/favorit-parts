import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getPrice } from "@/api/rest/endpoints/price/price";
import { API_ERROR } from "@/api/rest/errors";

import { normalizeBrands, normalizeOffers } from "./normalize";

const { pricelistGet } = getPrice();

/**
 * Состояние запроса.
 * @readonly
 * @enum {string}
 */
export const STATUS = { IDLE: "idle", LOADING: "loading", SUCCEEDED: "succeeded", FAILED: "failed" };

/**
 * Состояние запроса одного этапа поиска.
 * @template T
 * @typedef {object} SearchRequest
 * @property {STATUS} status Статус запроса.
 * @property {T[]} items Результат (пусто, пока идёт загрузка или при ошибке).
 * @property {string|null} error Код ошибки из `API_ERROR`.
 * @property {string|null} requestId Идентификатор последнего запроса этапа; ответы других запросов отбрасываются.
 */

/** @type {SearchRequest<never>} */
const initialRequest = { status: STATUS.IDLE, items: [], error: null, requestId: null };

/**
 * Время жизни кэша ответов: повторный поиск/клик в этот срок не ходит в сеть.
 * @type {number}
 */
export const CACHE_TTL_MS = 10 * 60 * 1000;
/**
 * Предел записей кэша на этап: при превышении вытесняются самые старые.
 * @type {number}
 */
export const CACHE_MAX_ENTRIES = 50;

const initialState = {
  number: "",
  brands: initialRequest,
  selectedBrand: null,
  offers: initialRequest,
  // Успешные ответы: ключ → { items, fetchedAt }. Ошибки не кэшируются
  cache: { brands: {}, offers: {} },
};

/**
 * Номер без пробелов по краям — единственная форма, в которой он попадает в стор, запрос и ключ кэша.
 * @param {string} number Введённый номер.
 * @returns {string}
 */
export const normalizeNumber = (number) => number.trim();

/** Ключ кэша производителей (регистр не важен). @param {string} number @returns {string} */
const brandsKey = (number) => normalizeNumber(number).toLowerCase();
/** Ключ кэша предложений. @param {{ number: string, brand: string }} arg @returns {string} */
const offersKey = ({ number, brand }) => `${brandsKey(number)}|${brand}`;

/**
 * Свежая запись кэша или null.
 * @param {Record<string, { items: object[], fetchedAt: number }>} entries Записи кэша этапа.
 * @param {string} key Ключ записи.
 * @returns {{ items: object[], fetchedAt: number }|null}
 */
const readCache = (entries, key) => {
  const entry = entries[key];
  return entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS ? entry : null;
};

/**
 * Выбрасывает просроченные записи, затем самые старые сверх лимита (изменяет `entries`).
 * @param {Record<string, { items: object[], fetchedAt: number }>} entries Записи кэша этапа.
 * @returns {void}
 */
const pruneCache = (entries) => {
  const now = Date.now();
  for (const key of Object.keys(entries)) {
    if (now - entries[key].fetchedAt >= CACHE_TTL_MS) delete entries[key];
  }
  const keys = Object.keys(entries);
  if (keys.length <= CACHE_MAX_ENTRIES) return;
  keys
    .sort((a, b) => entries[a].fetchedAt - entries[b].fetchedAt)
    .slice(0, keys.length - CACHE_MAX_ENTRIES)
    .forEach((key) => delete entries[key]);
};

// Запрос в полёте по каждому этапу: новый запрос отменяет предыдущий, а не просто игнорирует его ответ
const inflight = { brands: null, offers: null };
/**
 * Отменяет запросы указанных этапов и заводит новый `AbortController` для первого из них.
 * @param {...("brands"|"offers")} stages Этапы, запросы которых обесцениваются; первый — запускаемый.
 * @returns {AbortSignal}
 */
const nextSignal = (...stages) => {
  stages.forEach((stage) => inflight[stage]?.abort());
  const controller = new AbortController();
  inflight[stages[0]] = controller;
  return controller.signal;
};

/**
 * Номер → список производителей.
 * Отменяет запросы прошлого поиска; свежий кэш возвращает без обращения к сети.
 * Аргумент — введённый номер (`string`); при ошибке отклоняется кодом `API_ERROR`.
 */
export const fetchBrands = createAsyncThunk(
  "search/fetchBrands",
  async (rawNumber, { getState, rejectWithValue }) => {
    const number = normalizeNumber(rawNumber);
    // новый поиск обесценивает и запрос предложений прошлого поиска
    const signal = nextSignal("brands", "offers");
    const cached = readCache(getState().search.cache.brands, brandsKey(number));
    if (cached) return cached;
    try {
      return { items: normalizeBrands(await pricelistGet({ number }, { signal })), fetchedAt: Date.now() };
    } catch (error) {
      return rejectWithValue(error.code ?? API_ERROR.UNKNOWN);
    }
  },
  // pending сразу получает запись кэша, чтобы показать её без мигания скелетона
  {
    getPendingMeta: ({ arg }, { getState }) => ({ cached: readCache(getState().search.cache.brands, brandsKey(arg)) }),
  },
);

/**
 * Номер + производитель → искомая деталь и аналоги.
 * Аргумент — `{ number, brand }`; при ошибке отклоняется кодом `API_ERROR`.
 */
export const fetchOffers = createAsyncThunk(
  "search/fetchOffers",
  async ({ number: rawNumber, brand }, { getState, rejectWithValue }) => {
    const number = normalizeNumber(rawNumber);
    const signal = nextSignal("offers");
    const cached = readCache(getState().search.cache.offers, offersKey({ number, brand }));
    if (cached) return cached;
    try {
      return {
        items: normalizeOffers(await pricelistGet({ number, brand, analogues: "on" }, { signal })),
        fetchedAt: Date.now(),
      };
    } catch (error) {
      return rejectWithValue(error.code ?? API_ERROR.UNKNOWN);
    }
  },
  {
    getPendingMeta: ({ arg }, { getState }) => ({ cached: readCache(getState().search.cache.offers, offersKey(arg)) }),
  },
);

/**
 * Подключает обработчики thunk-а этапа. Ответ учитывается только от последнего запроса своего этапа:
 * быстрые повторные поиски/клики не перетирают друг друга.
 * @param {import("@reduxjs/toolkit").ActionReducerMapBuilder<object>} builder Билдер `extraReducers`.
 * @param {import("@reduxjs/toolkit").AsyncThunk} thunk Thunk этапа.
 * @param {"brands"|"offers"} key Ключ этапа в состоянии и кэше.
 * @param {object} options
 * @param {(arg: any) => string} options.cacheKey Ключ записи кэша по аргументу thunk-а.
 * @param {(state: object, action: object) => void} options.onPending Дополнительные изменения состояния при старте запроса.
 * @returns {void}
 */
const handleRequest = (builder, thunk, key, { cacheKey, onPending }) => {
  builder
    .addCase(thunk.pending, (state, action) => {
      const { cached, requestId } = action.meta;
      state[key] = cached
        ? { status: STATUS.SUCCEEDED, items: cached.items, error: null, requestId }
        : { status: STATUS.LOADING, items: [], error: null, requestId };
      onPending(state, action);
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state.cache[key][cacheKey(action.meta.arg)] = action.payload;
      pruneCache(state.cache[key]);
      if (state[key].requestId !== action.meta.requestId) return;
      state[key] = { ...state[key], status: STATUS.SUCCEEDED, items: action.payload.items };
    })
    .addCase(thunk.rejected, (state, action) => {
      if (state[key].requestId !== action.meta.requestId) return;
      state[key] = { ...state[key], status: STATUS.FAILED, error: action.payload ?? API_ERROR.UNKNOWN };
    });
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    // Ответы могут зависеть от ключа покупателя, поэтому при его смене кэш не переиспользуется
    clearCache: (state) => {
      state.cache = initialState.cache;
    },
    // Возврат на адрес без номера: результаты очищаются, кэш остаётся; запоздавшие ответы отбрасываются по requestId
    resetSearch: (state) => ({ ...initialState, cache: state.cache }),
  },
  extraReducers: (builder) => {
    handleRequest(builder, fetchBrands, "brands", {
      cacheKey: brandsKey,
      // Новый поиск сбрасывает выбранного производителя и предложения прошлого поиска
      onPending: (state, action) => {
        state.number = normalizeNumber(action.meta.arg);
        state.selectedBrand = null;
        state.offers = initialRequest;
      },
    });
    handleRequest(builder, fetchOffers, "offers", {
      cacheKey: offersKey,
      onPending: (state, action) => {
        state.selectedBrand = action.meta.arg.brand;
      },
    });
  },
});

/**
 * Экшены слайса: `clearCache` — сбросить кэш ответов, `resetSearch` — очистить результаты (кэш остаётся).
 */
export const { clearCache, resetSearch } = searchSlice.actions;

/**
 * Смена ключа API: сбрасывает кэш и повторяет текущий поиск (производители и, если выбран, предложения).
 * @returns {(dispatch: Function, getState: Function) => void} Thunk.
 */
export const restartSearch = () => (dispatch, getState) => {
  dispatch(clearCache());
  const { number, selectedBrand } = getState().search;
  if (!number) return;
  dispatch(fetchBrands(number));
  if (selectedBrand) dispatch(fetchOffers({ number, brand: selectedBrand }));
};

/**
 * Поиск по форме: производители и, если он единственный, сразу его предложения (шаг выбора не нужен).
 * Адресная строка («назад/вперёд», загрузка) идёт мимо: иначе «назад» тут же выбирал бы производителя заново.
 * @param {string} value Номер, введённый в форме.
 * @returns {(dispatch: Function, getState: Function) => Promise<object>} Thunk; результат — последний выполненный экшен.
 */
export const submitSearch = (value) => async (dispatch, getState) => {
  const action = await dispatch(fetchBrands(value));
  if (!fetchBrands.fulfilled.match(action)) return action;
  const { number, brands } = getState().search;
  // ответ устарел (запущен новый поиск) или выбирать не из чего
  if (brands.requestId !== action.meta.requestId || brands.items.length !== 1) return action;
  return dispatch(fetchOffers({ number, brand: brands.items[0].brand }));
};

export default searchSlice.reducer;
