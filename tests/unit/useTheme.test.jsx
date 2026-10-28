import { act, renderHook } from "@testing-library/react";

import { applyTheme, useTheme } from "@/hooks/useTheme";

describe("useTheme", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-palette");
    document.documentElement.removeAttribute("data-style");
    document.documentElement.classList.remove("dark");
    vi.restoreAllMocks();
  });

  it("повреждённое значение в localStorage → значения по умолчанию", () => {
    localStorage.setItem("theme", "{не json");
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toMatchObject({ palette: "blue", style: "favorit", dark: false });
  });

  it("неизвестный стиль заменяется на стиль по умолчанию, палитра сохраняется", () => {
    localStorage.setItem("theme", JSON.stringify({ palette: "amber", style: "nope", dark: true }));
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toEqual({ palette: "amber", style: "favorit", dark: true });
  });

  it("смена темы применяется к <html> и запоминается", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current[1]({ palette: "emerald", dark: true }));

    const root = document.documentElement;
    expect(root).toHaveAttribute("data-palette", "emerald");
    expect(root).toHaveClass("dark");
    expect(JSON.parse(localStorage.getItem("theme"))).toMatchObject({ palette: "emerald", dark: true });
  });

  it("недоступный localStorage не ломает смену темы", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    const { result } = renderHook(() => useTheme());
    act(() => result.current[1]({ style: "furrow" }));
    expect(result.current[0].style).toBe("furrow");
  });
});

describe("applyTheme", () => {
  it("выставляет палитру, стиль и класс dark", () => {
    applyTheme({ palette: "red", style: "blueprint", dark: false });
    const root = document.documentElement;
    expect(root).toHaveAttribute("data-palette", "red");
    expect(root).toHaveAttribute("data-style", "blueprint");
    expect(root).not.toHaveClass("dark");
  });
});
