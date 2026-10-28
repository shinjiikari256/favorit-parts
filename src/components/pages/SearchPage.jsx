import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";

import { Check } from "lucide-react";

import { ApiErrorAlert } from "@/components/composite/ApiErrorAlert";
import {
  BrandList,
  BrandListSkeleton,
  OffersTable,
  OffersTableSkeleton,
  SearchForm,
} from "@/components/composite/search";
import { Button, Card, CardTitle, EmptyState } from "@/components/ui";
import { readSearchParams, useSearchUrl } from "@/hooks/useSearchUrl";
import { STATUS, fetchOffers, submitSearch } from "@/store/search/searchSlice";
import { selectBrands, selectNumber, selectOffers, selectSelectedBrand } from "@/store/search/selectors";

/**
 * @param {{ status: string }} state Состояние запроса.
 * @returns {boolean} Запрос выполняется.
 */
const isLoading = (state) => state.status === STATUS.LOADING;
/**
 * @param {{ status: string }} state Состояние запроса.
 * @returns {boolean} Запрос завершён (успешно или с ошибкой).
 */
const isSettled = (state) => state.status === STATUS.SUCCEEDED || state.status === STATUS.FAILED;

/**
 * Прокручивает к блоку и переносит фокус на его заголовок (на мобильных результат оказывается ниже экрана).
 * Учитывает `prefers-reduced-motion`.
 * @param {HTMLElement|null} title Заголовок блока.
 * @returns {void}
 */
const reveal = (title) => {
  if (!title) return;
  title.focus({ preventScroll: true });
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  title.scrollIntoView?.({ block: "start", behavior: reduce ? "auto" : "smooth" });
};

/**
 * Подбор по артикулу: форма поиска, список производителей и предложения с аналогами.
 * Состояние поиска хранится в Redux и синхронизируется с адресной строкой через {@link useSearchUrl}.
 * @returns {JSX.Element}
 */
export const SearchPage = () => {
  const { t } = useTranslation("search");
  const dispatch = useDispatch();
  const number = useSelector(selectNumber);
  const brands = useSelector(selectBrands);
  const selectedBrand = useSelector(selectSelectedBrand);
  const offers = useSelector(selectOffers);

  // Фильтр действует только для текущей выдачи (артикул + производитель); новый поиск открывается без него
  const scope = `${number}|${selectedBrand}`;
  const [stockFilter, setStockFilter] = useState({ scope: "", on: false });
  const inStockOnly = stockFilter.scope === scope && stockFilter.on;
  // Блок, к которому прокрутить, когда запрос завершится; новый объект на каждый запрос (повторный клик тоже срабатывает)
  const [target, setTarget] = useState(null);
  const handledTarget = useRef(null);
  const brandsTitle = useRef(null);
  const offersTitle = useRef(null);

  useSearchUrl();

  const brandsSettled = isSettled(brands);
  const offersSettled = isSettled(offers);
  // Единственный производитель выбирается сам: после поиска прокручиваем сразу к предложениям
  const autoSelected = brands.status === STATUS.SUCCEEDED && brands.items.length === 1;
  useEffect(() => {
    if (!target || handledTarget.current === target) return;
    const block = target.block === "brands" && autoSelected ? "offers" : target.block;
    if (!(block === "brands" ? brandsSettled : offersSettled)) return;
    handledTarget.current = target;
    reveal((block === "brands" ? brandsTitle : offersTitle).current);
  }, [target, autoSelected, brandsSettled, offersSettled]);

  const searchBrands = (value) => {
    setTarget({ block: "brands" });
    return dispatch(submitSearch(value));
  };
  const searchOffers = (brand) => {
    setTarget({ block: "offers" });
    return dispatch(fetchOffers({ number, brand }));
  };

  const searched = brands.status !== STATUS.IDLE;

  const form = (
    <Card data-role="search">
      <CardTitle>{t("title")}</CardTitle>
      <div className="w-full">
        <SearchForm
          key={number}
          initialValue={number || readSearchParams().number}
          loading={isLoading(brands)}
          onSearch={searchBrands}
        />
      </div>
    </Card>
  );

  const brandsBlock = searched && (
    <Card>
      <CardTitle ref={brandsTitle} tabIndex={-1} className="outline-none">
        {t("brands.title")}
      </CardTitle>
      {isLoading(brands) && <BrandListSkeleton />}
      {brands.status === STATUS.FAILED && <ApiErrorAlert code={brands.error} onRetry={() => searchBrands(number)} />}
      {brands.status === STATUS.SUCCEEDED &&
        (brands.items.length ? (
          <BrandList brands={brands.items} selectedBrand={selectedBrand} onSelect={searchOffers} />
        ) : (
          <EmptyState>{t("brands.empty", { number })}</EmptyState>
        ))}
    </Card>
  );

  const offersBlock = offers.status !== STATUS.IDLE && (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CardTitle ref={offersTitle} tabIndex={-1} className="outline-none">
          {t("offers.title")}
        </CardTitle>
        {offers.status === STATUS.SUCCEEDED && offers.items.length > 0 && (
          <Button
            size="sm"
            variant={inStockOnly ? "default" : "outline"}
            aria-pressed={inStockOnly}
            onClick={() => setStockFilter({ scope, on: !inStockOnly })}
          >
            {inStockOnly && <Check />}
            {t("offers.inStockOnly")}
          </Button>
        )}
      </div>
      {isLoading(offers) && <OffersTableSkeleton />}
      {offers.status === STATUS.FAILED && (
        <ApiErrorAlert code={offers.error} onRetry={() => searchOffers(selectedBrand)} />
      )}
      {offers.status === STATUS.SUCCEEDED &&
        (offers.items.length ? (
          <OffersTable key={scope} offers={offers.items} inStockOnly={inStockOnly} />
        ) : (
          <EmptyState>{t("offers.empty", { brand: selectedBrand })}</EmptyState>
        ))}
    </Card>
  );

  return (
    <div className="flex flex-col gap-4">
      {form}
      {brandsBlock}
      {offersBlock}
    </div>
  );
};
