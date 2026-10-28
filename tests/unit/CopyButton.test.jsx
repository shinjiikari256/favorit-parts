import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CopyButton } from "@/components/ui/copy-button";

const LABELS = { label: "Скопировать", copiedLabel: "Скопировано", failedLabel: "Не удалось скопировать" };

const setClipboard = (writeText) =>
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });

describe("CopyButton", () => {
  afterEach(() => {
    delete navigator.clipboard;
  });

  it("без Clipboard API кнопка не показывается", () => {
    setClipboard(undefined);
    delete navigator.clipboard;
    const { container } = render(<CopyButton value="0189" {...LABELS} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("копирует значение и сообщает об успехе", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue();
    setClipboard(writeText); // после setup(): userEvent подменяет navigator.clipboard своей заглушкой
    render(<CopyButton value="0189" {...LABELS} />);
    await user.click(screen.getByRole("button"));
    expect(writeText).toHaveBeenCalledWith("0189");
    expect(await screen.findByRole("button", { name: /скопирован/i })).toBeInTheDocument();
  });

  it("при отказе буфера обмена сообщает о неудаче", async () => {
    const user = userEvent.setup();
    setClipboard(vi.fn().mockRejectedValue(new Error("denied")));
    render(<CopyButton value="0189" {...LABELS} />);
    await user.click(screen.getByRole("button"));
    expect(await screen.findByRole("button", { name: /не удалось/i })).toBeInTheDocument();
  });
});
