import { memo } from "react";
import { useTranslation } from "react-i18next";

import { TableCell, TableRow } from "@/components/ui";
import { cn } from "@/lib/utils";

import { EMPTY, OfferNumber, Price, Tags, WarehouseInfo, WarehouseToggle, isExpandable } from "./OfferParts";

/**
 * Строка склада — в тех же колонках, что и товары; акцентная полоса слева отделяет её от товаров.
 * @param {object} props
 * @param {import("@/store/search/normalize").OfferWarehouse} props.warehouse Склад.
 * @param {boolean} props.best Самая выгодная цена (склад с минимальной ценой лучшего предложения).
 * @param {boolean} props.last Последний склад в списке (рисует нижнюю границу под первой колонкой).
 * @returns {JSX.Element}
 */
const WarehouseRow = ({ warehouse: w, best, last }) => {
  const { t } = useTranslation("search");
  const cell = "border-b bg-muted/40";
  return (
    <TableRow className="border-b-0 hover:bg-transparent">
      <TableCell className={last ? "border-b" : undefined} />
      <TableCell className={cn("border-l-4 border-l-primary/40 whitespace-normal", cell)}>
        <WarehouseInfo warehouse={w} />
      </TableCell>
      <TableCell className={cn(cell, "text-right font-bold whitespace-nowrap", best && "text-primary")}>
        <Price price={w.price} />
      </TableCell>
      <TableCell className={cn(cell, "text-right whitespace-nowrap")}>
        {t("offers.stock", { count: w.stock })}
      </TableCell>
    </TableRow>
  );
};

/**
 * Предложение — отдельный `<tbody>` (так строку и её склады можно измерить как единое целое для виртуализации);
 * при нескольких складах раскрывается списком складов. Раскрытие хранит родитель: строка размонтируется за пределами окна.
 * @param {object} props
 * @param {import("@/store/search/normalize").Offer} props.offer Предложение.
 * @param {boolean} props.best Самая выгодная цена.
 * @param {boolean} props.open Список складов раскрыт.
 * @param {(id: string) => void} props.onToggle Переключить раскрытие по `id` предложения.
 * @param {number} props.index Индекс в виртуализованном списке (`data-index`).
 * @param {number} props.rowIndex Позиция строки в таблице для `aria-rowindex` (с учётом шапки).
 * @param {(node: Element|null) => void} props.measure Ref для измерения высоты строки виртуализатором.
 * @returns {JSX.Element}
 */
export const OfferRow = memo(({ offer, best, open, onToggle, index, rowIndex, measure }) => {
  const { t } = useTranslation("search");
  const expandable = isExpandable(offer);
  const priced = offer.price !== null;
  // у открытого товара нижняя граница только под правыми колонками (под триггером её нет)
  const rest = open && "border-b";

  return (
    <tbody ref={measure} data-index={index}>
      <TableRow aria-rowindex={rowIndex} className={cn(open && "border-b-0")}>
        <TableCell className="w-10 pr-0">
          <WarehouseToggle offer={offer} open={open} onToggle={onToggle} compact />
        </TableCell>
        <TableCell className={cn("whitespace-normal", rest)}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold">{offer.brand}</span>
            <Tags offer={offer} best={best} />
          </div>
          <div className="text-conte-body-s text-muted-foreground">{offer.name}</div>
          <OfferNumber number={offer.number} />
        </TableCell>
        <TableCell className={cn("text-right font-bold whitespace-nowrap", rest, best && "text-primary")}>
          {expandable && priced && (
            <span className="mr-1 font-normal text-muted-foreground">{t("offers.fromLabel")}</span>
          )}
          <Price price={offer.price} />
        </TableCell>
        <TableCell className={cn("text-right whitespace-nowrap", rest)}>
          {offer.stock > 0 ? t("offers.stock", { count: offer.stock }) : EMPTY}
        </TableCell>
      </TableRow>
      {expandable &&
        open &&
        offer.warehouses.map((w, i) => {
          const isCheapest = best && w.price !== null && w.price === offer.price;
          return <WarehouseRow key={w.id} warehouse={w} best={isCheapest} last={i === offer.warehouses.length - 1} />;
        })}
    </tbody>
  );
});
