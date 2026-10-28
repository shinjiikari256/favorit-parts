import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { fetchBrands, fetchOffers, resetSearch } from "@/store/search/searchSlice";
import { selectNumber, selectSelectedBrand } from "@/store/search/selectors";

/**
 * Номер и производитель из адресной строки (`?number=…&brand=…`).
 * @returns {{ number: string, brand: string }} Номер без пробелов по краям и производитель; пустые строки, если параметров нет.
 */
export const readSearchParams = () => {
  const params = new URLSearchParams(window.location.search);
  return { number: params.get("number")?.trim() ?? "", brand: params.get("brand") ?? "" };
};

const BASE_TITLE = document.title;

/**
 * Заголовок вкладки и записи в истории: «название приложения | артикул · производитель».
 * @param {string} number Артикул; пустой — вернётся исходный заголовок страницы.
 * @param {string|null} brand Производитель.
 * @returns {string}
 */
const toTitle = (number, brand) =>
  number ? `${BASE_TITLE} | ${[number, brand].filter(Boolean).join(" · ")}` : BASE_TITLE;

/**
 * Строка запроса для адресной строки.
 * @param {string} number Артикул.
 * @param {string|null} brand Производитель; без него параметр `brand` не добавляется.
 * @returns {string} Например, `?number=123&brand=BOSCH`.
 */
const toSearch = (number, brand) => {
  const params = new URLSearchParams({ number });
  if (brand) params.set("brand", brand);
  return `?${params}`;
};

/**
 * Связывает поиск с адресной строкой (?number=…&brand=…): при загрузке и «назад/вперёд»
 * запускает запросы по адресу, при поиске/выборе производителя — добавляет запись в историю
 * и обновляет заголовок вкладки.
 * @returns {void}
 */
export function useSearchUrl() {
  const dispatch = useDispatch();
  const number = useSelector(selectNumber);
  const brand = useSelector(selectSelectedBrand);

  useEffect(() => {
    const apply = () => {
      const { number: urlNumber, brand: urlBrand } = readSearchParams();
      if (!urlNumber) {
        dispatch(resetSearch());
        return;
      }
      dispatch(fetchBrands(urlNumber));
      if (urlBrand) dispatch(fetchOffers({ number: urlNumber, brand: urlBrand }));
    };
    apply();
    window.addEventListener("popstate", apply);
    return () => window.removeEventListener("popstate", apply);
  }, [dispatch]);

  useEffect(() => {
    document.title = toTitle(number, brand);
    if (!number) return;
    const search = toSearch(number, brand);
    if (search !== window.location.search) window.history.pushState(null, "", search);
  }, [number, brand]);
}
