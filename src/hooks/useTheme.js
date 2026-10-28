import { useCallback, useState } from "react";

/**
 * Доступные цветовые палитры; `color` — акцент для `meta[name="theme-color"]`.
 * @type {ReadonlyArray<{ id: string, color: string }>}
 */
export const PALETTES = [
  { id: "red", color: "oklch(58.151% 0.23341 19.554)" },
  { id: "blue", color: "oklch(46.6% 0.139 252.3)" },
  { id: "emerald", color: "oklch(50% 0.13 160)" },
  { id: "amber", color: "oklch(72% 0.16 70)" },
];

/**
 * Доступные стили оформления; первый — по умолчанию.
 * @type {ReadonlyArray<string>}
 */
export const STYLES = ["favorit", "blueprint", "furrow"];

/**
 * @typedef {object} Theme
 * @property {string} palette Идентификатор палитры из {@link PALETTES}.
 * @property {string} style Стиль оформления из {@link STYLES}.
 * @property {boolean} dark Тёмный режим.
 */

const STORAGE_KEY = "theme";
const DEFAULT = { palette: "blue", style: STYLES[0], dark: false };

/**
 * Тема из `localStorage`; при отсутствии или повреждении — значения по умолчанию
 * (тёмный режим берётся из `prefers-color-scheme`).
 * @returns {Theme}
 */
const readStored = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && PALETTES.some((p) => p.id === stored.palette))
      return {
        palette: stored.palette,
        style: STYLES.includes(stored.style) ? stored.style : DEFAULT.style,
        dark: !!stored.dark,
      };
  } catch {
    // localStorage недоступен или значение повреждено — берём значения по умолчанию
  }
  return { ...DEFAULT, dark: window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false };
};

/**
 * Выставляет палитру, стиль и режим на `<html>` и цвет адресной строки (`meta[name="theme-color"]`).
 * Вызывается до рендера (без вспышки) и при смене темы.
 * @param {Theme} theme Применяемая тема.
 * @returns {void}
 */
export function applyTheme({ palette, style, dark }) {
  const root = document.documentElement;
  root.setAttribute("data-palette", palette);
  root.setAttribute("data-style", style);
  root.classList.toggle("dark", dark);
  // Цвет адресной строки на мобильных — акцент выбранной палитры
  const color = PALETTES.find((p) => p.id === palette)?.color;
  if (color) document.querySelector('meta[name="theme-color"]')?.setAttribute("content", color);
}

/**
 * Применяет сохранённую тему до первого рендера.
 * @returns {void}
 */
export function initTheme() {
  applyTheme(readStored());
}

/**
 * Палитра, стиль и светлая/тёмная тема; выбор запоминается в localStorage.
 * @returns {[Theme, (patch: Partial<Theme>) => void]} Текущая тема и функция частичного обновления
 *   (применяет тему к `<html>` и сохраняет её).
 */
export function useTheme() {
  const [theme, setThemeState] = useState(readStored);

  const setTheme = useCallback((patch) => {
    setThemeState((prev) => {
      const next = { ...prev, ...patch };
      applyTheme(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // не критично: тема просто не запомнится
      }
      return next;
    });
  }, []);

  return [theme, setTheme];
}
