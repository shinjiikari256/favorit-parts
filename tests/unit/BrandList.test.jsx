import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { BrandList } from "@/components/composite/search";

import "../i18n";

const makeBrands = (count) =>
  Array.from({ length: count }, (_, i) => ({
    id: `id-${i}`,
    brand: `Brand ${i}`,
    number: "0189",
    name: `Деталь ${i}`,
  }));

const hiddenOnMobile = (name) =>
  screen.getByRole("button", { name }).closest("li").className.includes("max-desktop:hidden");

describe("BrandList", () => {
  it("у каждого производителя показывает название детали и артикул", () => {
    render(<BrandList brands={makeBrands(2)} selectedBrand={null} onSelect={() => {}} />);
    const item = screen.getByRole("button", { name: /Brand 0/ });
    expect(item).toHaveTextContent("Деталь 0");
    expect(item).toHaveTextContent("Артикул: 0189");
  });

  it("до 10 производителей кнопки «Показать всех» нет", () => {
    render(<BrandList brands={makeBrands(10)} selectedBrand={null} onSelect={() => {}} />);
    expect(screen.queryByRole("button", { name: /Показать всех/ })).not.toBeInTheDocument();
  });

  it("на мобильных скрывает всё после 10-го, кнопка раскрывает и сворачивает список", async () => {
    const user = userEvent.setup();
    render(<BrandList brands={makeBrands(15)} selectedBrand={null} onSelect={() => {}} />);

    expect(hiddenOnMobile(/Brand 9\b/)).toBe(false);
    expect(hiddenOnMobile(/Brand 10\b/)).toBe(true);

    const toggle = screen.getByRole("button", { name: "Показать всех (15)" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Скрыть" })).toHaveAttribute("aria-expanded", "true");
    expect(hiddenOnMobile(/Brand 14\b/)).toBe(false);

    await user.click(screen.getByRole("button", { name: "Скрыть" }));
    expect(hiddenOnMobile(/Brand 14\b/)).toBe(true);
  });

  it("выбранный производитель остаётся виден в свёрнутом списке", () => {
    render(<BrandList brands={makeBrands(15)} selectedBrand="Brand 12" onSelect={() => {}} />);
    expect(hiddenOnMobile(/Brand 12\b/)).toBe(false);
    expect(hiddenOnMobile(/Brand 11\b/)).toBe(true);
  });

  it("клик по производителю передаёт его название", async () => {
    const onSelect = vi.fn();
    render(<BrandList brands={makeBrands(2)} selectedBrand={null} onSelect={onSelect} />);
    await userEvent.setup().click(screen.getByRole("button", { name: /Brand 1/ }));
    expect(onSelect).toHaveBeenCalledWith("Brand 1");
  });
});
