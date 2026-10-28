import { memo, useId } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { EMPTY, OfferNumber, Price, Tags, WarehouseInfo, WarehouseToggle, isExpandable } from "./OfferParts";

/**
 * Пара «подпись — значение».
 * @param {object} props
 * @param {string} props.label Подпись.
 * @param {string} [props.className] Классы значения.
 * @param {React.ReactNode} props.children Значение.
 * @returns {JSX.Element}
 */
const Metric = ({ label, className, children }) => (
  <div className="flex flex-col">
    <span className="text-conte-body-s text-muted-foreground">{label}</span>
    <span className={cn("font-bold", className)}>{children}</span>
  </div>
);

/**
 * Склад в раскрытом списке карточки: название, срок отгрузки, цена и остаток.
 * @param {object} props
 * @param {import("@/store/search/normalize").OfferWarehouse} props.warehouse Склад.
 * @param {boolean} props.best Самая выгодная цена (склад с минимальной ценой лучшего предложения).
 * @returns {JSX.Element}
 */
const OfferWarehouse = ({ warehouse: w, best }) => {
  const { t } = useTranslation("search");
  return (
    <li className="flex flex-col gap-1 border-l-4 border-l-primary/40 bg-muted/40 px-3 py-2">
      <WarehouseInfo warehouse={w} />
      <div className="flex items-baseline justify-between gap-4">
        <span className={cn("font-bold", best && "text-primary")}>
          <Price price={w.price} />
        </span>
        <span>{t("offers.stock", { count: w.stock })}</span>
      </div>
    </li>
  );
};

/**
 * Карточка предложения для узких экранов: те же данные, что и в строке таблицы; склады раскрываются списком (состояние хранит родитель).
 * @param {object} props
 * @param {import("@/store/search/normalize").Offer} props.offer Предложение.
 * @param {boolean} props.best Самая выгодная цена.
 * @param {boolean} props.open Список складов раскрыт.
 * @param {(id: string) => void} props.onToggle Переключить раскрытие по `id` предложения.
 * @returns {JSX.Element}
 */
export const OfferCard = memo(({ offer, best, open, onToggle }) => {
  const { t } = useTranslation("search");
  const warehousesId = useId();
  const expandable = isExpandable(offer);

  return (
    <article className="flex flex-col gap-3 rounded-lg border bg-background p-3">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold">{offer.brand}</span>
          <Tags offer={offer} best={best} />
        </div>
        <div className="text-conte-body-s text-muted-foreground">{offer.name}</div>
        <OfferNumber number={offer.number} />
      </div>

      <div className="flex items-start justify-between gap-4">
        <Metric label={t("offers.columns.price")} className={best ? "text-primary" : undefined}>
          {expandable && offer.price !== null && (
            <span className="mr-1 font-normal text-muted-foreground">{t("offers.fromLabel")}</span>
          )}
          <Price price={offer.price} />
        </Metric>
        <Metric label={t("offers.columns.stock")} className="text-right font-normal">
          {offer.stock > 0 ? t("offers.stock", { count: offer.stock }) : EMPTY}
        </Metric>
      </div>

      <WarehouseToggle offer={offer} open={open} onToggle={onToggle} controls={warehousesId} />
      {expandable && open && (
        <ul id={warehousesId} className="flex flex-col gap-2">
          {offer.warehouses.map((w) => (
            <OfferWarehouse key={w.id} warehouse={w} best={best && w.price !== null && w.price === offer.price} />
          ))}
        </ul>
      )}
    </article>
  );
});
