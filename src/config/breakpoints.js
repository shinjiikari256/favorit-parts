/**
 * Брейкпоинты в px — те же значения, что `--breakpoint-*` в `styles/breakpoints.css` (CSS-переменные из Tailwind в бандл не попадают).
 * Совпадение проверяет `tests/unit/breakpoints.test.js`.
 * @type {Readonly<Record<"mobile-lg"|"tablet"|"desktop", number>>}
 */
export const BREAKPOINTS = { "mobile-lg": 480, tablet: 768, desktop: 1024 };
