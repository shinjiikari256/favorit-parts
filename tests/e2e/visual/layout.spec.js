import { expect, test } from "@playwright/test";

import { brandsResponse } from "../../fixtures.js";
import { mockApi, openOffers, search } from "../helpers.js";

const manyBrands = {
  goods: Array.from({ length: 12 }, (_, i) => ({ ...brandsResponse.goods[0], goodsID: `id-${i}`, brand: `Brand${i}` })),
};

const noHorizontalScroll = async (page) =>
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);

test.describe("раскладка", () => {
  test.beforeEach(({ page }) => page.goto("/"));

  test.describe("десктоп", () => {
    test.use({ viewport: { width: 1280, height: 900 } });

    test("форма, под ней производители, ниже предложения", async ({ page }) => {
      await mockApi(page);
      await search(page, "01089");
      await openOffers(page);
      await expect(page.getByText("Mapco")).toBeVisible();

      const box = (locator) => locator.boundingBox();
      const form = await box(page.getByRole("search"));
      const brands = await box(page.getByRole("heading", { name: "Производители" }));
      const offers = await box(page.getByRole("heading", { name: "Аналоги и предложения" }));
      expect(brands.y).toBeGreaterThan(form.y + form.height);
      expect(offers.y).toBeGreaterThan(brands.y);
    });

    test("все производители видны, кнопки «Показать всех» нет", async ({ page }) => {
      await mockApi(page, { brands: manyBrands });
      await search(page, "01089");

      await expect(page.getByRole("button", { name: /Brand11\b/ })).toBeAttached();
      await expect(page.getByRole("button", { name: /Показать всех/ })).toBeHidden();
    });

    test("размер целей: кнопки настроек, копирования и раскрытия не меньше 24×24", async ({ page }) => {
      await mockApi(page);
      await search(page, "01089");
      await openOffers(page);
      await page.getByRole("table").waitFor();

      const targets = [
        page.getByRole("button", { name: "Ключ API" }),
        page.getByRole("button", { name: "Скопировать артикул" }).first(),
        page.getByRole("button", { name: /Склады: \d+/ }).first(),
      ];
      for (const target of targets) {
        const box = await target.boundingBox();
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });
  });

  test.describe("мобильные", () => {
    test.use({ viewport: { width: 390, height: 800 } });

    test("после 10-го производители скрыты, «Показать всех» раскрывает", async ({ page }) => {
      await mockApi(page, { brands: manyBrands });
      await search(page, "01089");

      await expect(page.getByRole("button", { name: /Brand9\b/ })).toBeVisible();
      await expect(page.getByRole("button", { name: /Brand10\b/ })).toBeHidden();
      await page.getByRole("button", { name: "Показать всех (12)" }).click();
      await expect(page.getByRole("button", { name: /Brand11\b/ })).toBeVisible();
      await page.getByRole("button", { name: "Скрыть" }).click();
      await expect(page.getByRole("button", { name: /Brand11\b/ })).toBeHidden();
    });

    test("предложения — карточки с выбором сортировки, без таблицы", async ({ page }) => {
      await mockApi(page);
      await search(page, "01089");
      await openOffers(page);

      await expect(page.getByRole("article").first()).toBeVisible();
      await expect(page.getByRole("table")).toHaveCount(0);

      await page.getByLabel("Сортировка").selectOption("price:desc");
      await expect(page.getByLabel("Сортировка")).toHaveValue("price:desc");
      await noHorizontalScroll(page);
    });
  });
});
