import { expect, test } from "@playwright/test";

import { emptyGoods } from "../../fixtures.js";
import { mockApi } from "../helpers.js";

const caffaro = (page) => page.getByRole("button", { name: /CAFFARO/ });

test.describe("ссылка", () => {
  test("номер и производитель в адресе → сразу результат", async ({ page }) => {
    await mockApi(page);
    await page.goto("/?number=01089&brand=CAFFARO");

    await expect(page.getByLabel("Артикул детали")).toHaveValue("01089");
    await expect(caffaro(page)).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page).toHaveTitle(/01089 · CAFFARO/);
  });

  test("только номер → список производителей без выбора", async ({ page }) => {
    await mockApi(page);
    await page.goto("/?number=01089");

    await expect(caffaro(page)).toBeVisible();
    await expect(caffaro(page)).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByRole("table")).toBeHidden();
  });

  test("номер с пробелами по краям обрезается", async ({ page }) => {
    await mockApi(page);
    await page.goto("/?number=%20%2001089%20");

    await expect(page.getByLabel("Артикул детали")).toHaveValue("01089");
    await expect(caffaro(page)).toBeVisible();
  });

  test.describe("невалидные комбинации", () => {
    for (const [name, query] of [
      ["производитель без номера", "?brand=CAFFARO"],
      ["пустой номер", "?number="],
      ["номер из одних пробелов", "?number=%20%20&brand=CAFFARO"],
      ["посторонние параметры", "?foo=bar"],
    ]) {
      test(`${name} → пустая форма, запросов нет`, async ({ page }) => {
        let calls = 0;
        await mockApi(page);
        await page.route("**/hs/hsprice/**", (route) => (calls++, route.fallback()));
        await page.goto(`/${query}`);

        await expect(page.getByLabel("Артикул детали")).toHaveValue("");
        await expect(page.getByRole("button", { name: "Найти" })).toBeDisabled();
        await expect(page.getByRole("table")).toBeHidden();
        await expect(page).toHaveTitle("Favorit Parts");
        expect(calls).toBe(0);
      });
    }

    test("несуществующий производитель → нет предложений, список производителей остаётся", async ({ page }) => {
      await mockApi(page, { offers: { goods: [emptyGoods] } });
      await page.goto("/?number=01089&brand=NOSUCH");

      await expect(caffaro(page)).toBeVisible();
      await expect(page.getByRole("table")).toBeHidden();
      await expect(page.getByText("предложений не найдено")).toBeVisible();
    });
  });

  test("«назад» и «вперёд» восстанавливают поиск и выбор", async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await page.getByLabel("Артикул детали").fill("01089");
    await page.getByRole("button", { name: "Найти" }).click();
    await caffaro(page).click();
    await expect(page).toHaveURL(/number=01089&brand=CAFFARO/);

    await page.goBack();
    await expect(page).toHaveURL(/\?number=01089$/);
    await expect(caffaro(page)).toHaveAttribute("aria-pressed", "false");

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByLabel("Артикул детали")).toHaveValue("");
    await expect(caffaro(page)).toBeHidden();

    await page.goForward();
    await page.goForward();
    await expect(caffaro(page)).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("table")).toBeVisible();
  });
});
