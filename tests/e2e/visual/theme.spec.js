import { expect, test } from "@playwright/test";

import { API, STYLES, search, setTheme } from "../helpers.js";

test.describe("тема", () => {
  test.beforeEach(({ page }) => page.goto("/"));

  test("тёмный режим меняет фон страницы в каждом стиле", async ({ page }) => {
    const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    for (const style of STYLES) {
      await setTheme(page, { style, dark: false });
      const light = await bg();
      await setTheme(page, { style, dark: true });
      expect(await bg(), style).not.toBe(light);
    }
  });

  test("контраст алерта ошибки не ниже 4,5:1 во всех стилях и режимах", async ({ page }) => {
    await page.route(API, (route) => route.fulfill({ json: { error: "Request quota exceeded!" } }));
    for (const style of STYLES) {
      for (const dark of [false, true]) {
        await setTheme(page, { style, dark });
        await search(page, "01089");
        const alert = page.getByRole("alert");
        await expect(alert).toBeVisible();

        const ratio = await alert.evaluate((el) => {
          // браузер приводит любой цвет (oklch, color-mix) к sRGB через canvas
          const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
          const pixel = (layers) => {
            ctx.clearRect(0, 0, 1, 1);
            for (const color of layers) {
              ctx.fillStyle = color;
              ctx.fillRect(0, 0, 1, 1);
            }
            return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
          };
          // фон алерта поверх всех полупрозрачных фонов предков (у blueprint карточка прозрачная)
          const backs = [];
          for (let node = el; node; node = node.parentElement) backs.unshift(getComputedStyle(node).backgroundColor);
          const style = getComputedStyle(el);
          const luminance = (rgb) => {
            const [r, g, b] = rgb.map((v) => {
              const c = v / 255;
              return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };
          const text = luminance(pixel([style.color]));
          const back = luminance(pixel(backs));
          return (Math.max(text, back) + 0.05) / (Math.min(text, back) + 0.05);
        });
        expect(ratio, `${style}, ${dark ? "тёмный" : "светлый"}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});
