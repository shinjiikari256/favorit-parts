import { configureStore } from "@reduxjs/toolkit";

import search from "./search/searchSlice";

/**
 * Создаёт Redux-стор приложения.
 * @param {object} [preloadedState] Начальное состояние (например, для тестов).
 * @returns {import("@reduxjs/toolkit").EnhancedStore}
 */
export const createStore = (preloadedState) => configureStore({ reducer: { search }, preloadedState });

/** Единый стор приложения. */
export const store = createStore();
