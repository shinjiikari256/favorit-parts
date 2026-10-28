import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Сетка карточек — общая для списка и скелетона. */
const GRID_CLASS = "grid grid-cols-1 gap-2 mobile-lg:grid-cols-2 desktop:grid-cols-3";

/** На мобильных сворачиваем длинный список до этого числа производителей. */
const PREVIEW_COUNT = 10;

/**
 * Карточка производителя: название, деталь с его номером и артикул.
 * @param {object} props
 * @param {string} props.brand Название производителя.
 * @param {string} [props.name] Название детали.
 * @param {string} [props.number] Артикул.
 * @param {boolean} props.active Выбран (подсвечивается).
 * @param {boolean} props.hidden Скрыт в свёрнутом списке на мобильных.
 * @param {(brand: string) => void} props.onSelect Вызывается с названием производителя при клике.
 * @returns {JSX.Element}
 */
const BrandCard = ({ brand, name, number, active, hidden, onSelect }) => {
  const { t } = useTranslation("search");
  return (
    <li className={cn(hidden && "max-desktop:hidden")}>
      <button
        type="button"
        aria-pressed={active}
        onClick={() => onSelect(brand)}
        className={cn(
          "flex cursor-pointer flex-col gap-0.5 text-left outline-none transition-colors",
          "hover:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "h-full w-full rounded-lg border px-4 py-3",
          active ? "border-primary bg-light-primary" : "bg-background",
        )}
      >
        <span className="font-bold">{brand}</span>
        {name && <span className="text-conte-body-s">{name}</span>}
        {number && <span className="text-conte-body-s text-muted-foreground">{t("offers.number", { number })}</span>}
      </button>
    </li>
  );
};

/**
 * Список производителей — выбор запускает поиск аналогов и предложений.
 * У каждого — деталь с этим номером (название и артикул). На мобильных показываются первые
 * `PREVIEW_COUNT` с кнопкой «Показать всех», выбранный из хвоста поднимается на последнее видимое место; на десктопе — весь список сеткой с прокруткой.
 * @param {object} props
 * @param {Array<import("@/store/search/normalize").Brand>} props.brands Производители.
 * @param {string|null} props.selectedBrand Выбранный производитель (подсвечивается).
 * @param {(brand: string) => void} props.onSelect Вызывается с названием производителя при клике.
 * @returns {JSX.Element}
 */
export const BrandList = ({ brands, selectedBrand, onSelect }) => {
  const { t } = useTranslation("search");
  const listId = useId();
  const [expanded, setExpanded] = useState(false);
  const collapsible = brands.length > PREVIEW_COUNT;

  const items = useMemo(() => {
    const collapsed = collapsible && !expanded;
    const ordered = [...brands];
    // Выбранный из хвоста поднимаем на последнее видимое место, чтобы в свёрнутом списке осталось ровно PREVIEW_COUNT
    const activeIndex = ordered.findIndex(({ brand }) => brand === selectedBrand);
    if (collapsed && activeIndex >= PREVIEW_COUNT) {
      ordered.splice(PREVIEW_COUNT - 1, 0, ...ordered.splice(activeIndex, 1));
    }
    return ordered.map((item, index) => ({
      ...item,
      active: item.brand === selectedBrand,
      hidden: collapsed && index >= PREVIEW_COUNT,
    }));
  }, [brands, selectedBrand, collapsible, expanded]);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-conte-body-s text-muted-foreground">{t("brands.hint")}</p>
      <ul id={listId} className={cn(GRID_CLASS, "-m-1 max-h-96 overflow-y-auto p-1")}>
        {items.map(({ id, ...card }) => (
          <BrandCard key={id ?? card.brand} {...card} onSelect={onSelect} />
        ))}
      </ul>
      {collapsible && (
        <Button
          variant="outline"
          size="sm"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={() => setExpanded((v) => !v)}
          className="desktop:hidden"
        >
          {expanded ? t("brands.hide") : t("brands.showAll", { count: brands.length })}
        </Button>
      )}
    </div>
  );
};

/**
 * Скелетон на месте BrandList: те же подсказка и карточки (бренд, название, артикул).
 * @param {object} props
 * @param {number} [props.count=6] Число карточек-заглушек.
 * @returns {JSX.Element}
 */
export const BrandListSkeleton = ({ count = 6 }) => {
  const { t } = useTranslation("search");

  return (
    <div data-testid="loader" role="status" aria-busy="true" className="flex flex-col gap-2">
      <span className="sr-only">{t("loading")}</span>
      <Skeleton className="my-[3px] h-3.5 w-64 max-w-full" />
      <div className={GRID_CLASS}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="flex flex-col gap-1.5 rounded-lg border px-4 py-3">
            <Skeleton className="my-0.5 h-4 w-24" />
            <Skeleton className="my-[3px] h-3.5 w-3/4" />
            <Skeleton className="my-[3px] h-3.5 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
};
