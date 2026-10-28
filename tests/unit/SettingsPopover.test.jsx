import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SettingsPopover } from "@/components/composite/SettingsPopover";

import "../i18n";

const setup = () => {
  const user = userEvent.setup();
  render(
    <>
      <SettingsPopover icon={<span>i</span>} label="Настройки">
        <button type="button">Внутри</button>
      </SettingsPopover>
      <button type="button">Снаружи</button>
    </>,
  );
  return user;
};

describe("SettingsPopover", () => {
  it("при открытии переносит фокус на панель", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Настройки" }));
    expect(screen.getByRole("dialog", { name: "Настройки" })).toHaveFocus();
  });

  it("Escape закрывает панель и возвращает фокус на кнопку", async () => {
    const user = setup();
    const trigger = screen.getByRole("button", { name: "Настройки" });
    await user.click(trigger);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("Tab за пределы панели закрывает её", async () => {
    const user = setup();
    await user.click(screen.getByRole("button", { name: "Настройки" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "Внутри" })).toHaveFocus();
    await user.tab();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Снаружи" })).toHaveFocus();
  });
});
