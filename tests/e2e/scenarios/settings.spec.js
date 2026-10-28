import { expect, test } from "@playwright/test";

import { mockApi, openOffers, search } from "../helpers.js";

const KEY = "11111111-2222-3333-4444-555555555555";

test.describe("настройки", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
  });

  test("ключ API: проверка, применение, сохранение", async ({ page }) => {
    await search(page, "01089");
    await openOffers(page);
    await expect(page.getByRole("table")).toBeVisible();

    await page.getByRole("button", { name: "Ключ API" }).click();
    const input = page.getByRole("textbox", { name: "Ключ API" });
    await input.fill("1111");
    await input.press("Enter");
    await expect(page.getByText("Неполный ключ")).toBeVisible();

    const request = page.waitForRequest((req) => new URL(req.url()).searchParams.get("key") === KEY);
    await input.fill(KEY);
    await input.press("Enter");
    await request;
    await expect(page.getByText("Ключ применён, поиск обновлён")).toBeVisible();

    await page.reload();
    await page.getByRole("button", { name: "Ключ API" }).click();
    await expect(page.getByRole("textbox", { name: "Ключ API" })).toHaveValue(KEY);
  });

  test("тема сохраняется после перезагрузки", async ({ page }) => {
    const html = page.locator("html");
    await page.getByRole("button", { name: "Тема" }).click();
    await page.getByRole("button", { name: "Тёмная" }).click();
    await page.getByRole("button", { name: "Чертёж" }).click();
    await expect(html).toHaveClass(/dark/);
    await expect(html).toHaveAttribute("data-style", "blueprint");

    await page.reload();
    await expect(html).toHaveClass(/dark/);
    await expect(html).toHaveAttribute("data-style", "blueprint");
  });
});
