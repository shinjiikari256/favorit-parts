import { useId } from "react";
import { useTranslation } from "react-i18next";

import { inputVariants } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Варианты сортировки; `label` — ключ перевода `offers.sort.<label>`. */
const OPTIONS = [
  { value: "", label: "default" },
  { value: "price:asc", label: "priceAsc" },
  { value: "price:desc", label: "priceDesc" },
  { value: "stock:asc", label: "stockAsc" },
  { value: "stock:desc", label: "stockDesc" },
];

/**
 * Сортировка → значение `<option>` («поле:направление» или пустая строка).
 * @param {import("./offersSort").OffersSort|null} sort
 * @returns {string}
 */
const toValue = (sort) => (sort ? `${sort.field}:${sort.dir}` : "");

/**
 * Сортировка для карточного вида (на мобильных заголовков таблицы нет).
 * @param {object} props
 * @param {import("./offersSort").OffersSort|null} props.sort Текущая сортировка.
 * @param {(sort: import("./offersSort").OffersSort|null) => void} props.onChange Вызывается с новой сортировкой (`null` — сброс).
 * @returns {JSX.Element}
 */
export const OffersSortSelect = ({ sort, onChange }) => {
  const { t } = useTranslation("search");
  const id = useId();

  const handleChange = (event) => {
    const [field, dir] = event.target.value.split(":");
    onChange(field ? { field, dir } : null);
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-conte-body-s text-muted-foreground">
        {t("offers.sort.label")}
      </label>
      <select id={id} value={toValue(sort)} onChange={handleChange} className={cn(inputVariants({ size: "md" }))}>
        {OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {t(`offers.sort.${label}`)}
          </option>
        ))}
      </select>
    </div>
  );
};
