import { expect, test } from "@playwright/test";

import { offersResponse } from "../../fixtures.js";
import { mockApi, openOffers, search } from "../helpers.js";

const COUNT = 500;
const manyOffers = {
  goods: [
    {
      ...offersResponse.goods[0],
      analogues: Array.from({ length: COUNT }, (_, i) => ({
        goodsID: `id-${i}`,
        brand: `Analog${i}`,
        number: `N${i}`,
        name: `Деталь ${i}`,
        count: 5,
        price: 100 + i,
        rate: 1,
        warehouses: [
          { code: "A", id: `a${i}`, own: false, price: 100 + i, stock: 2, shipmentDate: null },
          { code: "B", id: `b${i}`, own: false, price: 110 + i, stock: 3, shipmentDate: null },
        ],
      })),
    },
  ],
};

test.describe("виртуализация списка предложений", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page, { offers: manyOffers });
    await page.goto("/");
    await search(page, "01089");
    await openOffers(page);
  });

  test.describe("десктоп", () => {
    test.use({ viewport: { width: 1280, height: 800 } });

    test("в DOM лишь часть строк, последняя достижима прокруткой, раскрытие сохраняется", async ({ page }) => {
      const table = page.getByRole("table");
      await expect(table).toHaveAttribute("aria-rowcount", String(COUNT + 2));
      const rendered = () => table.locator("tbody[data-index]").count();
      expect(await rendered()).toBeLessThan(60);

      await table.getByRole("button", { name: "Склады: 2" }).first().click();
      await expect(table.getByText("Склад: A").first()).toBeVisible();

      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect(table.getByText(`Analog${COUNT - 1}`)).toBeVisible();
      expect(await rendered()).toBeLessThan(60);

      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(table.getByText("Склад: A").first()).toBeVisible();
    });
  });

  test.describe("мобильные", () => {
    test.use({ viewport: { width: 390, height: 800 } });

    test("карточек в DOM немного, последняя достижима, нет горизонтальной прокрутки", async ({ page }) => {
      const cards = page.getByRole("article");
      await expect(cards.first()).toBeVisible();
      expect(await cards.count()).toBeLessThan(40);

      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await expect(page.getByText(`Analog${COUNT - 1}`)).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(
        0,
      );
    });
  });
});
