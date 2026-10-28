import { useMemo, useSyncExternalStore } from "react";

import { BREAKPOINTS } from "@/config/breakpoints";

/**
 * Подписывается на media query `(min-width: …)` и сообщает, достигнут ли брейкпоинт.
 * Без `matchMedia` (тесты, SSR) считается, что экран широкий.
 * @param {keyof typeof BREAKPOINTS} breakpoint Имя брейкпоинта из `config/breakpoints`.
 * @returns {boolean} `true`, когда ширина окна не меньше брейкпоинта.
 */
export function useMinWidth(breakpoint) {
  const query = `(min-width: ${BREAKPOINTS[breakpoint]}px)`;

  const [subscribe, getSnapshot] = useMemo(
    () => [
      (onChange) => {
        const media = window.matchMedia?.(query);
        media?.addEventListener("change", onChange);
        return () => media?.removeEventListener("change", onChange);
      },
      () => window.matchMedia?.(query).matches ?? true,
    ],
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}
