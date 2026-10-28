import { Provider } from "react-redux";

import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SearchPage } from "@/components/pages/SearchPage";
import { createStore } from "@/store";

import { brandsResponse, emptyGoods, offersResponse } from "../fixtures";
import "../i18n";
import { mockPricelistGet } from "../mockApi";

const setup = () => {
  render(
    <Provider store={createStore()}>
      <SearchPage />
    </Provider>,
  );
  return userEvent.setup();
};

const search = async (user, number) => {
  await user.type(screen.getByLabelText("Артикул детали"), number);
  await user.click(screen.getByRole("button", { name: "Найти" }));
};

beforeEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("SearchPage", () => {
  it("не даёт отправить пустой номер", () => {
    setup();
    expect(screen.getByRole("button", { name: "Найти" })).toBeDisabled();
  });

  it("два этапа: артикул → производители → таблица аналогов", async () => {
    let resolveBrands;
    mockPricelistGet
      .mockReturnValueOnce(new Promise((resolve) => (resolveBrands = resolve)))
      .mockResolvedValueOnce(offersResponse);
    const user = setup();

    await search(user, " 0189 ");
    expect(screen.getByTestId("loader")).toBeInTheDocument();
    resolveBrands(brandsResponse);
    await user.click(await screen.findByRole("button", { name: /CAFFARO/ }));

    const table = await screen.findByRole("table");
    expect(mockPricelistGet).toHaveBeenNthCalledWith(1, { number: "0189" }, expect.anything());
    expect(mockPricelistGet).toHaveBeenNthCalledWith(
      2,
      { number: "0189", brand: "CAFFARO", analogues: "on" },
      expect.anything(),
    );

    const rows = within(table).getAllByRole("row").slice(1);
    expect(rows).toHaveLength(3);
    expect(within(rows[0]).getByText("Искомая")).toBeInTheDocument();
    expect(rows[1]).toHaveTextContent("Mapco");
    expect(rows[1]).toHaveTextContent(/8\s680,20/);
    expect(rows[1]).toHaveTextContent("10 шт.");
    expect(rows[1]).toHaveTextContent("от");

    await user.click(within(table).getByRole("button", { name: /Склады: 2/ }));
    expect(within(table).getAllByRole("row")).toHaveLength(6);
    expect(within(table).getAllByText(/Отгрузка/)).toHaveLength(2);
    await user.click(within(table).getByRole("button", { name: /Склады: 2/ }));
    expect(within(table).getAllByRole("row")).toHaveLength(4);
    const cells = within(rows[2]).getAllByRole("cell");
    expect(cells[2]).toHaveTextContent("—");
    expect(cells[3]).toHaveTextContent("—");
  });

  it("пишет номер и производителя в адрес и восстанавливает поиск по адресу", async () => {
    mockPricelistGet.mockResolvedValueOnce(brandsResponse).mockResolvedValueOnce(offersResponse);
    const user = setup();
    await search(user, "0189");
    await user.click(await screen.findByRole("button", { name: /CAFFARO/ }));
    await screen.findByRole("table");
    expect(window.location.search).toBe("?number=0189&brand=CAFFARO");
    expect(document.title).toMatch(/\| 0189 · CAFFARO$/);
  });

  it("при загрузке запускает поиск по номеру и производителю из адреса", async () => {
    window.history.replaceState(null, "", "/?number=0189&brand=CAFFARO");
    mockPricelistGet.mockResolvedValueOnce(brandsResponse).mockResolvedValueOnce(offersResponse);
    setup();

    // У скелетона тоже role="table": ждём, пока он заменится настоящей таблицей
    await waitFor(() => expect(screen.queryByTestId("loader")).not.toBeInTheDocument());
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(mockPricelistGet).toHaveBeenNthCalledWith(1, { number: "0189" }, expect.anything());
    expect(mockPricelistGet).toHaveBeenNthCalledWith(
      2,
      { number: "0189", brand: "CAFFARO", analogues: "on" },
      expect.anything(),
    );
    expect(screen.getByLabelText("Артикул детали")).toHaveValue("0189");
  });

  it("другой производитель: фильтр «Только в наличии» и сортировка сбрасываются", async () => {
    mockPricelistGet
      .mockResolvedValueOnce(brandsResponse)
      .mockResolvedValueOnce(offersResponse)
      .mockResolvedValueOnce(offersResponse);
    const user = setup();
    await search(user, "0189");
    await user.click(await screen.findByRole("button", { name: /CAFFARO/ }));
    await screen.findByRole("table");

    await user.click(screen.getByRole("button", { name: "Только в наличии" }));
    await user.click(screen.getByRole("button", { name: /Цена/ }));
    expect(screen.getByRole("button", { name: "Только в наличии" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("columnheader", { name: /Цена/ })).toHaveAttribute("aria-sort", "ascending");

    await user.click(screen.getByRole("button", { name: /ZEN/ }));
    await waitFor(() => expect(screen.queryByTestId("loader")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Только в наличии" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("columnheader", { name: /Цена/ })).toHaveAttribute("aria-sort", "none");
  });

  it("«назад» на адрес без номера очищает результаты и поле", async () => {
    mockPricelistGet.mockResolvedValueOnce(brandsResponse);
    const user = setup();
    await search(user, "0189");
    await screen.findByRole("button", { name: /CAFFARO/ });

    window.history.replaceState(null, "", "/");
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await waitFor(() => expect(screen.queryByRole("button", { name: /CAFFARO/ })).not.toBeInTheDocument());
    expect(screen.queryByText("Производители")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Артикул детали")).toHaveValue("");
  });

  it("кнопка сброса очищает поле и возвращает в него фокус", async () => {
    const user = setup();
    expect(screen.queryByRole("button", { name: "Очистить поле" })).not.toBeInTheDocument();

    const input = screen.getByLabelText("Артикул детали");
    await user.type(input, "0189");
    await user.click(screen.getByRole("button", { name: "Очистить поле" }));

    expect(input).toHaveValue("");
    expect(input).toHaveFocus();
    expect(screen.getByRole("button", { name: "Найти" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Очистить поле" })).not.toBeInTheDocument();
  });

  it("после выбора производителя прокручивает к блоку предложений и фокусирует заголовок", async () => {
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    mockPricelistGet.mockResolvedValueOnce(brandsResponse).mockResolvedValueOnce(offersResponse);
    const user = setup();
    await search(user, "0189");
    await user.click(await screen.findByRole("button", { name: /CAFFARO/ }));

    const title = await screen.findByRole("heading", { name: "Аналоги и предложения" });
    await waitFor(() => expect(title).toHaveFocus());
    expect(scrollIntoView).toHaveBeenCalled();
    delete Element.prototype.scrollIntoView;
  });

  it("единственный производитель выбирается сам, предложения показываются без лишнего клика", async () => {
    mockPricelistGet.mockResolvedValueOnce({ goods: [brandsResponse.goods[0]] }).mockResolvedValueOnce(offersResponse);
    const user = setup();

    await search(user, "0189");

    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(mockPricelistGet).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: /ZEN/ })).toHaveAttribute("aria-pressed", "true");
  });

  it("показывает «ничего не найдено» для пустой структуры ответа", async () => {
    mockPricelistGet.mockResolvedValue({ goods: [emptyGoods] });
    const user = setup();

    await search(user, "7260500039S");

    expect(await screen.findByText("По номеру «7260500039S» ничего не найдено")).toBeInTheDocument();
  });

  it("ошибка ключа: вместо «Повторить» подсказка про настройки", async () => {
    mockPricelistGet.mockRejectedValue(Object.assign(new Error("x"), { code: "invalidKey" }));
    const user = setup();

    await search(user, "0189");
    expect(await screen.findByText("Неверный ключ покупателя")).toBeInTheDocument();
    expect(screen.getByText(/Проверьте ключ API в настройках/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Повторить" })).not.toBeInTheDocument();
  });

  it("показывает ошибку API и повторяет запрос по кнопке", async () => {
    mockPricelistGet
      .mockRejectedValueOnce(Object.assign(new Error("x"), { code: "quota" }))
      .mockResolvedValueOnce(brandsResponse);
    const user = setup();

    await search(user, "0189");
    expect(await screen.findByText("Превышен лимит запросов. Попробуйте позже")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Повторить" }));
    expect(await screen.findByRole("button", { name: /ZEN/ })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("показывает сообщение о сбое сети", async () => {
    mockPricelistGet.mockRejectedValue(Object.assign(new Error("Network Error"), { code: "network" }));
    const user = setup();

    await search(user, "0189");

    expect(await screen.findByText(/Нет связи с сервисом/)).toBeInTheDocument();
  });
});
