import { expect, test } from "@playwright/test";

import { brandsResponse, emptyGoods } from "../../fixtures.js";
import { API, mockApi, search } from "../helpers.js";

test.describe("поиск", () => {
  test.beforeEach(({ page }) => page.goto("/"));

  test("два этапа: артикул → производители → аналоги и предложения", async ({ page }) => {
    await mockApi(page);
    await search(page, "01089");

    await expect(page.getByRole("button", { name: /CAFFARO/ })).toBeVisible();
    await page
      .getByRole("button", { name: /MEYLE/ })
      .or(page.getByRole("button", { name: /ZEN/ }))
      .first()
      .click();

    await expect(page.getByText("Mapco")).toBeVisible();
    await expect(page.getByText("Аналог").first()).toBeVisible();
    await expect(page.getByText("Лучшая цена")).toBeVisible();
  });

  test("запрос бренда уходит с analogues=on", async ({ page }) => {
    await mockApi(page);
    await search(page, "01089");
    const request = page.waitForRequest((req) => new URL(req.url()).searchParams.get("brand") === "ZEN");
    await page.getByRole("button", { name: /ZEN/ }).click();
    expect(new URL((await request).url()).searchParams.get("analogues")).toBe("on");
  });

  test("пустая структура ответа → «ничего не найдено»", async ({ page }) => {
    await mockApi(page, { brands: { goods: [emptyGoods] } });
    await search(page, "7260500039S");
    await expect(page.getByText("ничего не найдено")).toBeVisible();
  });

  test("пустой номер нельзя отправить", async ({ page }) => {
    let calls = 0;
    await page.route(API, (route) => (calls++, route.fulfill({ json: brandsResponse })));
    await expect(page.getByRole("button", { name: "Найти" })).toBeDisabled();
    expect(calls).toBe(0);
  });

  test.describe("ошибки", () => {
    test("ошибка API в теле ответа → алерт и повтор", async ({ page }) => {
      let fail = true;
      await page.route(API, (route) =>
        route.fulfill({ json: fail ? { error: "Request quota exceeded!" } : brandsResponse }),
      );
      await search(page, "01089");
      await expect(page.getByText("Превышен лимит запросов")).toBeVisible();

      fail = false;
      await page.getByRole("button", { name: "Повторить" }).click();
      await expect(page.getByRole("button", { name: /CAFFARO/ })).toBeVisible();
    });

    test("сбой сети → сообщение о связи", async ({ page }) => {
      await page.route(API, (route) => route.abort("failed"));
      await search(page, "01089");
      await expect(page.getByText("Нет связи с сервисом")).toBeVisible();
    });
  });
});
