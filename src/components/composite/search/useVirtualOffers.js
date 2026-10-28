import { useCallback, useLayoutEffect, useMemo, useState } from "react";

import { defaultRangeExtractor, useWindowVirtualizer } from "@tanstack/react-virtual";

/** Сколько позиций дополнительно держать в DOM по обе стороны от видимой области. */
const OVERSCAN = 6;

/**
 * Оконная виртуализация списка предложений (прокручивается страница, а не вложенный блок).
 * Строки измеряются по факту (`measure` вешается на корневой элемент строки вместе с `data-index`).
 * Строка с фокусом остаётся в DOM, даже если вышла за окно, — иначе фокус терялся бы при прокрутке.
 *
 * @param {object} options
 * @param {import("react").RefObject<HTMLElement>} options.containerRef начало списка (для смещения от верха страницы)
 * @param {Array<{id: string}>} options.items
 * @param {number} options.estimateSize ориентировочная высота строки до измерения
 * @returns {{ rows: Array<{index: number, offer: object}>, before: number, after: number, total: number, measure: Function, focusProps: object }}
 */
export function useVirtualOffers({ containerRef, items, estimateSize }) {
  const [scrollMargin, setScrollMargin] = useState(0);
  const [focusedIndex, setFocusedIndex] = useState(null);

  // смещение списка от верха документа меняется при перестройке страницы выше него
  // без списка зависимостей намеренно: проверка при каждом рендере, setState только при реальном сдвиге
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const top = containerRef.current ? containerRef.current.getBoundingClientRect().top + window.scrollY : 0;
    if (Math.round(top) !== Math.round(scrollMargin)) setScrollMargin(top);
  });

  const rangeExtractor = useCallback(
    (range) => {
      const indexes = defaultRangeExtractor({ ...range, overscan: OVERSCAN });
      if (focusedIndex === null || focusedIndex >= range.count || indexes.includes(focusedIndex)) return indexes;
      return [...indexes, focusedIndex].sort((a, b) => a - b);
    },
    [focusedIndex],
  );

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => estimateSize,
    scrollMargin,
    getItemKey: (index) => items[index].id,
    rangeExtractor,
  });

  const virtual = virtualizer.getVirtualItems();
  const total = virtualizer.getTotalSize();
  const first = virtual[0];
  const last = virtual[virtual.length - 1];

  const focusProps = useMemo(
    () => ({
      onFocus: (event) => {
        const row = event.target.closest("[data-index]");
        setFocusedIndex(row ? Number(row.dataset.index) : null);
      },
      onBlur: (event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusedIndex(null);
      },
    }),
    [],
  );
  const rows = useMemo(() => virtual.map(({ index }) => ({ index, offer: items[index] })), [virtual, items]);

  return {
    rows,
    before: first ? first.start - scrollMargin : 0,
    after: last ? total - (last.end - scrollMargin) : 0,
    total,
    measure: virtualizer.measureElement,
    focusProps,
  };
}
