import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LanguageSwitcher } from "@/components/composite/LanguageSwitcher";

import i18n from "../i18n";

afterEach(() => i18n.changeLanguage("ru"));

describe("LanguageSwitcher", () => {
  it("текущий язык отмечен нажатым, клик переключает язык", async () => {
    const user = userEvent.setup();
    render(<LanguageSwitcher />);
    expect(screen.getByRole("button", { name: "RU" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "false");

    await user.click(screen.getByRole("button", { name: "EN" }));
    expect(i18n.language).toBe("en");
    expect(screen.getByRole("button", { name: "EN" })).toHaveAttribute("aria-pressed", "true");
  });
});
