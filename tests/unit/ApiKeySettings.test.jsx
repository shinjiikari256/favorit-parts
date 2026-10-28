import { Provider } from "react-redux";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ApiKeySettings } from "@/components/composite/ApiKeySettings";
import { API_KEY, getApiKey, getCustomApiKey } from "@/config/api";
import { createStore } from "@/store";
import { fetchBrands } from "@/store/search/searchSlice";

import { brandsResponse } from "../fixtures";
import "../i18n";
import { mockPricelistGet } from "../mockApi";

const KEY = "11111111-2222-3333-4444-555555555555";

const setup = async () => {
  const store = createStore();
  mockPricelistGet.mockResolvedValue(brandsResponse);
  await store.dispatch(fetchBrands("0189"));
  mockPricelistGet.mockClear();
  render(
    <Provider store={store}>
      <ApiKeySettings />
    </Provider>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Ключ API" }));
  return { user, input: screen.getByRole("textbox", { name: "Ключ API" }), store };
};

describe("ApiKeySettings", () => {
  it("неполный ключ не сохраняется, показывается ошибка", async () => {
    const { user, input } = await setup();
    await user.type(input, "1111{Enter}");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(/Неполный ключ/)).toBeInTheDocument();
    expect(getCustomApiKey()).toBeNull();
    expect(mockPricelistGet).not.toHaveBeenCalled();
  });

  it("полный ключ сохраняется, кэш сбрасывается и текущий поиск повторяется", async () => {
    const { user, input, store } = await setup();
    await user.type(input, `${KEY}{Enter}`);
    expect(getCustomApiKey()).toBe(KEY);
    expect(screen.getByText("Ключ применён, поиск обновлён")).toBeInTheDocument();
    // запрос ушёл в сеть, а не взят из кэша
    expect(mockPricelistGet).toHaveBeenCalledWith({ number: "0189" }, expect.anything());
    expect(Object.keys(store.getState().search.cache.offers)).toHaveLength(0);
  });

  it("ручная очистка поля удаляет свой ключ: дальше действует ключ по умолчанию", async () => {
    const { user, input } = await setup();
    await user.type(input, `${KEY}{Enter}`);
    await user.clear(input);
    await user.keyboard("{Enter}");
    expect(getCustomApiKey()).toBeNull();
    expect(getApiKey()).toBe(API_KEY);
  });

  it("крестик очищает поле, удаляет свой ключ и перезапускает поиск", async () => {
    const { user, input } = await setup();
    expect(screen.queryByRole("button", { name: "Очистить поле" })).not.toBeInTheDocument();
    await user.type(input, `${KEY}{Enter}`);
    mockPricelistGet.mockClear();
    await user.click(screen.getByRole("button", { name: "Очистить поле" }));
    expect(getCustomApiKey()).toBeNull();
    expect(input).toHaveValue("");
    expect(mockPricelistGet).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Очистить поле" })).not.toBeInTheDocument();
  });
});
