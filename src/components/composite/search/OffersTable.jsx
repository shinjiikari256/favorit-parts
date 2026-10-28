import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState, Table } from "@/components/ui";
import { useMinWidth } from "@/hooks/useMinWidth";

import { OfferCard } from "./OfferCard";
import { OfferRow } from "./OfferRow";
import { OffersSortSelect } from "./OffersSortSelect";
import { OffersTableHeader } from "./OffersTableHeader";
import { findBestId, nextSort, sortOffers } from "./offersSort";
import { useVirtualOffers } from "./useVirtualOffers";

/** Ориентировочная высота до измерения: строка таблицы / карточка с отступом. */
const ROW_SIZE = 96;
const CARD_SIZE = 190;
/** Число колонок таблицы (для `colSpan` распорки). */
const COLUMNS = 4;

/**
 * Пустая строка-распорка: заменяет не отрисованные (вне окна) позиции, чтобы полоса прокрутки отражала весь список.
 * @param {object} props
 * @param {number} props.height Высота, px.
 * @returns {JSX.Element}
 */
const Spacer = ({ height }) => (
  <tbody aria-hidden>
    <tr style={{ height }}>
      <td colSpan={COLUMNS} className="p-0" />
    </tr>
  </tbody>
);

/**
 * Итог: искомая деталь и аналоги — название/производитель, цена («от» при нескольких складах),
 * общий остаток; позиции с несколькими складами раскрываются. `inStockOnly` скрывает позиции без остатка.
 * От `tablet` — таблица, на узких экранах — карточки с отдельным выбором сортировки.
 * Список виртуализован: в DOM только позиции около видимой области (аналогов бывает больше тысячи).
 * @param {object} props
 * @param {Array<import("@/store/search/normalize").Offer>} props.offers Предложения.
 * @param {boolean} [props.inStockOnly=false] Скрыть позиции без остатка.
 * @returns {JSX.Element}
 */
export const OffersTable = ({ offers, inStockOnly = false }) => {
  const { t } = useTranslation("search");
  const [sort, setSort] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const ref = useRef(null);
  const wide = useMinWidth("tablet");
  const bestId = useMemo(() => findBestId(offers), [offers]);
  const visible = useMemo(
    () => sortOffers(inStockOnly ? offers.filter((o) => o.stock > 0) : offers, sort),
    [offers, inStockOnly, sort],
  );
  const { rows, before, after, measure, focusProps } = useVirtualOffers({
    containerRef: ref,
    items: visible,
    estimateSize: wide ? ROW_SIZE : CARD_SIZE,
  });

  const toggle = useCallback(
    (id) =>
      setExpanded((current) => {
        const next = new Set(current);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
    [],
  );

  const handleSort = (field) => {
    setSort((current) => nextSort(current, field));
    // прокручено ниже начала таблицы — возвращаемся к её шапке
    if (ref.current && ref.current.getBoundingClientRect().top < 0) {
      const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      ref.current.scrollIntoView?.({ block: "start", behavior: reduce ? "auto" : "smooth" });
    }
  };

  if (!visible.length) return <EmptyState>{t("offers.emptyInStock")}</EmptyState>;

  if (!wide) {
    return (
      <div ref={ref} className="flex flex-col gap-3" {...focusProps}>
        <OffersSortSelect sort={sort} onChange={setSort} />
        <ul style={{ paddingTop: before, paddingBottom: after }}>
          {rows.map(({ index, offer }) => (
            <li key={offer.id} ref={measure} data-index={index} className="pb-3">
              <OfferCard offer={offer} best={offer.id === bestId} open={expanded.has(offer.id)} onToggle={toggle} />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div ref={ref} {...focusProps}>
      <Table containerClassName="overflow-visible" aria-rowcount={visible.length + 1}>
        <caption className="sr-only">{t("offers.title")}</caption>
        <OffersTableHeader sort={sort} onSort={handleSort} />
        {before > 0 && <Spacer height={before} />}
        {rows.map(({ index, offer }) => (
          <OfferRow
            key={offer.id}
            offer={offer}
            best={offer.id === bestId}
            open={expanded.has(offer.id)}
            onToggle={toggle}
            index={index}
            rowIndex={index + 2}
            measure={measure}
          />
        ))}
        {after > 0 && <Spacer height={after} />}
      </Table>
    </div>
  );
};
