import { useTranslation } from "react-i18next";

import { ChevronDown, ChevronUp } from "lucide-react";

import { TableHead, TableHeader, TableRow } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Классы липкой ячейки шапки: границы рисуем псевдоэлементами, т.к. border у thead/tr не едет вместе с sticky-ячейками. */
const HEAD_CLASS =
  "sticky top-0 z-10 bg-background-gray before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-border after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-border";

/** Направление сортировки → значение `aria-sort`. */
const ARIA_SORT = { asc: "ascending", desc: "descending" };

/**
 * Заголовок колонки; с `onSort` превращается в кнопку сортировки.
 * @param {object} props
 * @param {string} props.label Название колонки.
 * @param {import("./offersSort").OffersSort["field"]} props.field Поле сортировки.
 * @param {import("./offersSort").OffersSort|null} [props.sort] Текущая сортировка.
 * @param {(field: string) => void} [props.onSort] Обработчик клика; без него колонка не сортируется.
 * @returns {JSX.Element}
 */
const SortHead = ({ label, field, sort, onSort }) => {
  const dir = sort?.field === field ? sort.dir : null;
  return (
    <TableHead className={cn(HEAD_CLASS, "text-right")} aria-sort={onSort ? (ARIA_SORT[dir] ?? "none") : undefined}>
      {onSort ? (
        <button
          type="button"
          onClick={() => onSort(field)}
          className="-mr-1 inline-flex cursor-pointer items-center gap-1 rounded-md px-1 [font:inherit] [letter-spacing:inherit] [text-transform:inherit] outline-none transition-colors hover:opacity-80 focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {label}
          <span aria-hidden className="flex flex-col">
            <ChevronUp className={cn("-mb-1 size-4.5 stroke-[3]", dir === "asc" ? "text-primary" : "opacity-30")} />
            <ChevronDown className={cn("-mt-1 size-4.5 stroke-[3]", dir === "desc" ? "text-primary" : "opacity-30")} />
          </span>
        </button>
      ) : (
        label
      )}
    </TableHead>
  );
};

/**
 * Липкая шапка таблицы предложений. Без `onSort` (скелетон) колонки не интерактивны.
 * @param {object} props
 * @param {import("./offersSort").OffersSort|null} [props.sort] Текущая сортировка.
 * @param {(field: string) => void} [props.onSort] Клик по сортируемой колонке.
 * @returns {JSX.Element}
 */
export const OffersTableHeader = ({ sort, onSort }) => {
  const { t } = useTranslation("search");
  return (
    <TableHeader className="border-y-0">
      <TableRow aria-rowindex={1} className="border-b-0 hover:bg-transparent">
        <TableHead className={cn(HEAD_CLASS, "w-10")}>
          <span className="sr-only">{t("offers.columns.warehouses")}</span>
        </TableHead>
        <TableHead className={HEAD_CLASS}>{t("offers.columns.name")}</TableHead>
        <SortHead label={t("offers.columns.price")} field="price" sort={sort} onSort={onSort} />
        <SortHead label={t("offers.columns.stock")} field="stock" sort={sort} onSort={onSort} />
      </TableRow>
    </TableHeader>
  );
};
