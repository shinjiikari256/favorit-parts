import { expect, test } from "@playwright/test";

import { mockApi, openOffers, search } from "../helpers.js";

test.describe("десктоп", () => {
  test.use({ viewport: { width: 1280, height: 900 }, permissions: ["clipboard-read", "clipboard-write"] });

  test("подбор: поиск, сортировка, склады, копирование", async ({ page }) => {
    const table = page.getByRole("table");
    await mockApi(page);
    await page.goto("/");

    await test.step("найти и выбрать производителя", async () => {
      await search(page, "01089");
      await openOffers(page);
      await expect(page.getByRole("button", { name: /CAFFARO/ })).toHaveAttribute("aria-pressed", "true");
      await expect(table).toBeVisible();
    });

    await test.step("отсортировать по цене", async () => {
      const price = table.getByRole("columnheader", { name: /Цена/ });
      await price.getByRole("button").click();
      await expect(price).not.toHaveAttribute("aria-sort", "none");
    });

    await test.step("раскрыть склады", async () => {
      const toggle = table.getByRole("button", { name: /Склады: \d+/ }).first();
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      await expect(table.getByText(/Склад: /).first()).toBeVisible();
    });

    await test.step("скопировать артикул", async () => {
      await table.getByRole("button", { name: "Скопировать артикул" }).first().click();
      await expect(table.getByRole("button", { name: "Скопировано" })).toBeVisible();
      expect(await page.evaluate(() => navigator.clipboard.readText())).not.toBe("");
    });
  });

  test("новый поиск сбрасывает выбор и таблицу", async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await search(page, "01089");
    await openOffers(page);
    await expect(page.getByRole("table")).toBeVisible();

    await search(page, "7260500039S");
    await expect(page.getByRole("table")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /CAFFARO/ })).toHaveAttribute("aria-pressed", "false");
  });
});
