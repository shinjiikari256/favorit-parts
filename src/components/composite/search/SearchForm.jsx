import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Search, X } from "lucide-react";

import { Button, Input } from "@/components/ui";

/**
 * Поле ввода артикула. Запрос уходит по отправке формы (Enter / кнопка) — у ключа ограничена квота запросов.
 * @param {object} props
 * @param {string} [props.initialValue=""] Начальное значение поля.
 * @param {boolean} [props.loading] Идёт запрос: кнопка блокируется и показывает спиннер.
 * @param {(number: string) => void} props.onSearch Вызывается с введённым номером без пробелов по краям; пустой номер не отправляется.
 * @returns {JSX.Element}
 */
export const SearchForm = ({ initialValue = "", loading, onSearch }) => {
  const { t } = useTranslation("search");
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);
  const number = value.trim();

  const handleClear = () => {
    setValue("");
    inputRef.current?.focus();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (number) onSearch(number);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mobile-lg:flex-row" role="search">
      <label htmlFor="part-number" className="sr-only">
        {t("form.label")}
      </label>
      <div className="relative mobile-lg:flex-1">
        <Input
          ref={inputRef}
          id="part-number"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={t("form.placeholder")}
          autoComplete="off"
          autoFocus
          className={value ? "pr-11" : undefined}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={t("form.clear")}
            title={t("form.clear")}
            className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <Button type="submit" loading={loading} disabled={!number} className="mobile-lg:min-w-36">
        {!loading && <Search />}
        {t(loading ? "form.submitting" : "form.submit")}
      </Button>
    </form>
  );
};
