import { brandsResponse, offersResponse } from "../fixtures.js";

export const API = "**/hs/hsprice/**";

/** Мок сервиса: без `brand` — этап 1 (производители), с `brand` — этап 2 (аналоги). */
export const mockApi = (page, { brands = brandsResponse, offers = offersResponse } = {}) =>
  page.route(API, (route) => {
    const params = new URL(route.request().url()).searchParams;
    return route.fulfill({ json: params.get("brand") ? offers : brands });
  });

export const search = async (page, number) => {
  await page.getByLabel("Артикул детали").fill(number);
  await page.getByRole("button", { name: "Найти" }).click();
};

/** Выбирает производителя CAFFARO — открывает таблицу (или карточки) предложений. */
export const openOffers = (page) => page.getByRole("button", { name: /CAFFARO/ }).click();

/** Сохраняет тему в `localStorage` и перезагружает страницу. */
export const setTheme = async (page, { style, dark }) => {
  await page.evaluate((theme) => localStorage.setItem("theme", JSON.stringify(theme)), {
    palette: "blue",
    style,
    dark,
  });
  await page.reload();
};

export const STYLES = ["favorit", "blueprint", "furrow"];
