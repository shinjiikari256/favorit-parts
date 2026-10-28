import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OffersTable } from "@/components/composite/search";
import { Shipment } from "@/components/composite/search/OfferParts";

import "../i18n";

const warehouse = (id, price, stock) => ({
  id,
  code: id,
  price,
  stock,
  own: false,
  shipmentDate: null,
});
const offer = (id, brand, price, warehouses) => ({
  id,
  brand,
  name: `Деталь ${brand}`,
  number: id,
  isOrigin: false,
  price,
  stock: warehouses.reduce((sum, w) => sum + w.stock, 0),
  warehouses,
});

const offers = [
  offer("a", "Alpha", 300, [warehouse("w1", 300, 1)]),
  offer("b", "Beta", 100, [warehouse("w2", 100, 2), warehouse("w3", 120, 3)]),
];

const mockNarrow = () => {
  window.matchMedia = (query) => ({
    matches: !query.includes("min-width"),
    addEventListener: () => {},
    removeEventListener: () => {},
  });
};

describe("OffersTable", () => {
  afterEach(() => {
    delete window.matchMedia;
  });

  it("метка «Лучшая цена» у самого дешёвого предложения в наличии", () => {
    mockNarrow();
    render(<OffersTable offers={offers} />);
    const [alpha, beta] = screen.getAllByRole("article");
    expect(beta).toHaveTextContent("Лучшая цена");
    expect(alpha).not.toHaveTextContent("Лучшая цена");
  });

  it("клик по заголовку «Цена» переключает сортировку: по возрастанию → по убыванию → сброс", async () => {
    const user = userEvent.setup();
    render(<OffersTable offers={offers} />);
    const header = screen.getByRole("columnheader", { name: /Цена/ });
    expect(header).toHaveAttribute("aria-sort", "none");
    await user.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "ascending");
    await user.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "descending");
    await user.click(within(header).getByRole("button"));
    expect(header).toHaveAttribute("aria-sort", "none");
  });

  it("на широком экране — таблица", () => {
    render(<OffersTable offers={offers} />);
    expect(screen.getByRole("table", { name: "Аналоги и предложения" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")[0]).toHaveAccessibleName("Склады");
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

  describe("на узком экране", () => {
    beforeEach(mockNarrow);

    it("показывает карточки и select сортировки вместо таблицы", () => {
      render(<OffersTable offers={offers} />);
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.getAllByRole("article")).toHaveLength(2);
      expect(screen.getByLabelText("Сортировка")).toBeInTheDocument();
    });

    it("сортирует карточки по цене", async () => {
      const user = userEvent.setup();
      render(<OffersTable offers={offers} />);
      await user.selectOptions(screen.getByLabelText("Сортировка"), "price:asc");
      const [first] = screen.getAllByRole("article");
      expect(first).toHaveTextContent("Beta");
    });

    it("склады раскрываются кнопкой «Склады: N»", async () => {
      const user = userEvent.setup();
      render(<OffersTable offers={offers} />);
      const toggle = screen.getByRole("button", { name: "Склады: 2" });
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      await user.click(toggle);
      expect(toggle).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText(/Склад: w3/)).toBeInTheDocument();
    });
  });
});

describe("OffersTable: фильтр «Только в наличии»", () => {
  it("если всё без остатка — подсказка вместо пустой таблицы", () => {
    const empty = [{ ...offer("z", "Zeta", null, []), stock: 0 }];
    render(<OffersTable offers={empty} inStockOnly />);
    expect(screen.getByText(/Нет позиций в наличии/)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
});

describe("Shipment", () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it("показывает время в зоне браузера, а время по МСК — во всплывающей подсказке", () => {
    process.env.TZ = "Asia/Yekaterinburg";
    render(<Shipment date="2019-05-31T15:30:00+03:00" />);
    expect(screen.getByText(/если заказать до 17:30/)).toHaveAttribute("title", "15:30 МСК");
  });

  it("в поясе GMT+3 не выводит ни пояс, ни подсказку", () => {
    process.env.TZ = "Europe/Moscow";
    render(<Shipment date="2019-05-31T15:30:00+03:00" />);
    const el = screen.getByText("Отгрузка 31 мая, если заказать до 15:30");
    expect(el).not.toHaveAttribute("title");
  });
});
