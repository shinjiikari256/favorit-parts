import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { DisplaySettings } from "@/components/composite/DisplaySettings";

import "../i18n";

const THEME = { palette: "blue", style: "favorit", dark: false };

const setup = async (theme = THEME) => {
  const onThemeChange = vi.fn();
  const user = userEvent.setup();
  render(<DisplaySettings theme={theme} onThemeChange={onThemeChange} />);
  await user.click(screen.getByRole("button", { name: "Тема" }));
  return { user, onThemeChange };
};

describe("DisplaySettings", () => {
  it("текущие режим, стиль и палитра отмечены нажатыми", async () => {
    await setup();
    expect(screen.getByRole("button", { name: "Светлая" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Тёмная" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Фаворит" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Синяя" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Красная" })).toHaveAttribute("aria-pressed", "false");
  });

  it("тёмная тема отмечает «Тёмная»", async () => {
    await setup({ ...THEME, dark: true });
    expect(screen.getByRole("button", { name: "Тёмная" })).toHaveAttribute("aria-pressed", "true");
  });

  it("клик передаёт в onThemeChange только изменённое поле", async () => {
    const { user, onThemeChange } = await setup();

    await user.click(screen.getByRole("button", { name: "Тёмная" }));
    expect(onThemeChange).toHaveBeenLastCalledWith({ dark: true });

    await user.click(screen.getByRole("button", { name: "Чертёж" }));
    expect(onThemeChange).toHaveBeenLastCalledWith({ style: "blueprint" });

    await user.click(screen.getByRole("button", { name: "Красная" }));
    expect(onThemeChange).toHaveBeenLastCalledWith({ palette: "red" });
  });
});
