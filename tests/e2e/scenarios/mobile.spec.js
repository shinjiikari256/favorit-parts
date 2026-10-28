import { expect, test } from "@playwright/test";

import { brandsResponse, emptyGoods } from "../../fixtures.js";
import { mockApi, search } from "../helpers.js";

const manyBrands = {
  goods: Array.from({ length: 12 }, (_, i) => ({ ...brandsResponse.goods[0], goodsID: `id-${i}`, brand: `Brand${i}` })),
};

test.describe("телефон", () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test("свёрнутый список: выбор из хвоста остаётся на виду", async ({ page }) => {
    await mockApi(page, { brands: manyBrands });
    await page.goto("/");
    await search(page, "01089");

    await expect(page.getByRole("button", { name: /Brand11\b/ })).toBeHidden();
    await page.getByRole("button", { name: "Показать всех (12)" }).click();
    await page.getByRole("button", { name: /Brand11\b/ }).click();
    await page.getByRole("button", { name: "Скрыть" }).click();

    await expect(page.getByRole("button", { name: /Brand11\b/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: /Brand10\b/ })).toBeHidden();

    await expect(page.getByRole("article").first()).toBeVisible();
    await page.getByLabel("Сортировка").selectOption("price:desc");
    await expect(page.getByLabel("Сортировка")).toHaveValue("price:desc");
  });

  test("пустой ответ: сообщение вместо списка", async ({ page }) => {
    await mockApi(page, { brands: { goods: [emptyGoods] } });
    await page.goto("/");
    await search(page, "7260500039S");

    await expect(page.getByText("ничего не найдено")).toBeVisible();
    await expect(page.getByRole("article")).toHaveCount(0);
  });

  test("ссылка с производителем → карточки без таблицы", async ({ page }) => {
    await mockApi(page);
    await page.goto("/?number=01089&brand=CAFFARO");

    await expect(page.getByRole("article").first()).toBeVisible();
    await expect(page.getByRole("table")).toBeHidden();
  });
});
