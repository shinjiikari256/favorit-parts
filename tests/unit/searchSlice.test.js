import { createStore } from "@/store";
import { CACHE_MAX_ENTRIES, CACHE_TTL_MS, fetchBrands, fetchOffers, submitSearch } from "@/store/search/searchSlice";

import { brandsResponse, emptyGoods, offersResponse } from "../fixtures";
import { mockPricelistGet } from "../mockApi";

const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};

let store;
beforeEach(() => {
  store = createStore();
});

describe("search slice", () => {
  it("этап 1: запрашивает только номер и сохраняет производителей", async () => {
    mockPricelistGet.mockResolvedValue(brandsResponse);

    const pending = store.dispatch(fetchBrands("0189"));
    expect(store.getState().search.brands.status).toBe("loading");
    await pending;

    expect(mockPricelistGet).toHaveBeenCalledWith({ number: "0189" }, expect.anything());
    const { brands, number } = store.getState().search;
    expect(brands.status).toBe("succeeded");
    expect(brands.items).toHaveLength(3);
    expect(number).toBe("0189");
  });

  it("номер с пробелами по краям: одинаков в запросе, сторе и кэше", async () => {
    mockPricelistGet.mockResolvedValue(brandsResponse);

    await store.dispatch(fetchBrands("  0189 "));
    await store.dispatch(fetchBrands("0189"));

    expect(mockPricelistGet).toHaveBeenCalledTimes(1);
    expect(mockPricelistGet).toHaveBeenCalledWith({ number: "0189" }, expect.anything());
    expect(store.getState().search.number).toBe("0189");
  });

  it("этап 2: передаёт номер, бренд, analogues=on", async () => {
    mockPricelistGet.mockResolvedValue(offersResponse);

    await store.dispatch(fetchOffers({ number: "7160500039S", brand: "MEYLE" }));

    expect(mockPricelistGet).toHaveBeenCalledWith(
      { number: "7160500039S", brand: "MEYLE", analogues: "on" },
      expect.anything(),
    );
    const { offers, selectedBrand } = store.getState().search;
    expect(selectedBrand).toBe("MEYLE");
    expect(offers.items).toHaveLength(3);
  });

  it("пустой ответ API даёт succeeded с пустым списком", async () => {
    mockPricelistGet.mockResolvedValue({ goods: [emptyGoods] });

    await store.dispatch(fetchBrands("7260500039S"));

    expect(store.getState().search.brands).toMatchObject({ status: "succeeded", items: [] });
  });

  it("ошибка API сохраняется кодом", async () => {
    mockPricelistGet.mockRejectedValue(Object.assign(new Error("x"), { code: "quota" }));

    await store.dispatch(fetchBrands("0189"));

    expect(store.getState().search.brands).toMatchObject({ status: "failed", error: "quota" });
  });

  it("ошибка без кода превращается в unknown", async () => {
    mockPricelistGet.mockRejectedValue(new Error("boom"));

    await store.dispatch(fetchBrands("0189"));

    expect(store.getState().search.brands.error).toBe("unknown");
  });

  it("новый поиск сбрасывает выбранного производителя и предложения", async () => {
    mockPricelistGet.mockResolvedValueOnce(offersResponse).mockResolvedValueOnce(brandsResponse);
    await store.dispatch(fetchOffers({ number: "7160500039S", brand: "MEYLE" }));

    await store.dispatch(fetchBrands("0189"));

    const { selectedBrand, offers } = store.getState().search;
    expect(selectedBrand).toBeNull();
    expect(offers.status).toBe("idle");
  });

  it("устаревший ответ не перетирает результат последнего запроса", async () => {
    const first = deferred();
    const second = deferred();
    mockPricelistGet.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const p1 = store.dispatch(fetchBrands("111"));
    const p2 = store.dispatch(fetchBrands("222"));
    second.resolve(brandsResponse);
    await p2;
    first.resolve({ goods: [emptyGoods] });
    await p1;

    const { brands, number } = store.getState().search;
    expect(number).toBe("222");
    expect(brands.items).toHaveLength(3);
  });

  it("новый запрос того же этапа отменяет предыдущий через signal", async () => {
    mockPricelistGet.mockReturnValue(new Promise(() => {}));

    store.dispatch(fetchBrands("111"));
    store.dispatch(fetchBrands("222"));

    const [, first] = mockPricelistGet.mock.calls[0];
    const [, second] = mockPricelistGet.mock.calls[1];
    expect(first.signal.aborted).toBe(true);
    expect(second.signal.aborted).toBe(false);
  });

  it("новый поиск производителей отменяет запрос предложений прошлого поиска", async () => {
    mockPricelistGet.mockReturnValue(new Promise(() => {}));

    store.dispatch(fetchOffers({ number: "111", brand: "MEYLE" }));
    store.dispatch(fetchBrands("222"));

    expect(mockPricelistGet.mock.calls[0][1].signal.aborted).toBe(true);
  });

  describe("submitSearch", () => {
    const one = { goods: [brandsResponse.goods[0]] };

    it("единственный производитель выбирается сам, и сразу грузятся его предложения", async () => {
      mockPricelistGet.mockResolvedValueOnce(one).mockResolvedValueOnce(offersResponse);

      await store.dispatch(submitSearch("0189"));

      expect(mockPricelistGet).toHaveBeenNthCalledWith(
        2,
        { number: "0189", brand: "ZEN", analogues: "on" },
        expect.anything(),
      );
      const { selectedBrand, offers } = store.getState().search;
      expect(selectedBrand).toBe("ZEN");
      expect(offers.status).toBe("succeeded");
    });

    it("несколько производителей — выбор остаётся за пользователем", async () => {
      mockPricelistGet.mockResolvedValue(brandsResponse);

      await store.dispatch(submitSearch("0189"));

      expect(mockPricelistGet).toHaveBeenCalledTimes(1);
      expect(store.getState().search.selectedBrand).toBeNull();
    });

    it("ошибка и пустой ответ не выбирают никого", async () => {
      mockPricelistGet.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce({ goods: [emptyGoods] });

      await store.dispatch(submitSearch("0189"));
      await store.dispatch(submitSearch("0189"));

      expect(mockPricelistGet).toHaveBeenCalledTimes(2);
      expect(store.getState().search.selectedBrand).toBeNull();
    });

    it("устаревший ответ не выбирает производителя поверх нового поиска", async () => {
      const first = deferred();
      mockPricelistGet.mockReturnValueOnce(first.promise).mockResolvedValueOnce(brandsResponse);

      const p1 = store.dispatch(submitSearch("111"));
      await store.dispatch(submitSearch("222"));
      first.resolve(one);
      await p1;

      expect(mockPricelistGet).toHaveBeenCalledTimes(2);
      expect(store.getState().search.selectedBrand).toBeNull();
    });
  });

  describe("кэш", () => {
    afterEach(() => vi.useRealTimers());

    it("просроченные записи удаляются при следующем сохранении", async () => {
      vi.useFakeTimers();
      mockPricelistGet.mockResolvedValue(brandsResponse);
      await store.dispatch(fetchBrands("111"));

      vi.advanceTimersByTime(CACHE_TTL_MS + 1);
      await store.dispatch(fetchBrands("222"));

      expect(Object.keys(store.getState().search.cache.brands)).toEqual(["222"]);
    });

    it("сверх лимита вытесняются самые старые записи", async () => {
      vi.useFakeTimers();
      mockPricelistGet.mockResolvedValue(brandsResponse);

      for (let i = 0; i <= CACHE_MAX_ENTRIES; i++) {
        await store.dispatch(fetchBrands(`n${i}`));
        vi.advanceTimersByTime(10);
      }

      const keys = Object.keys(store.getState().search.cache.brands);
      expect(keys).toHaveLength(CACHE_MAX_ENTRIES);
      expect(keys).not.toContain("n0");
      expect(keys).toContain(`n${CACHE_MAX_ENTRIES}`);
    });

    it("повторный поиск того же артикула не ходит в сеть и сразу succeeded", async () => {
      mockPricelistGet.mockResolvedValue(brandsResponse);
      await store.dispatch(fetchBrands("0189"));

      const pending = store.dispatch(fetchBrands(" 0189 "));
      expect(store.getState().search.brands.status).toBe("succeeded");
      await pending;

      expect(mockPricelistGet).toHaveBeenCalledTimes(1);
      expect(store.getState().search.brands.items).toHaveLength(3);
    });

    it("предложения кэшируются по паре номер + производитель", async () => {
      mockPricelistGet.mockResolvedValue(offersResponse);
      const args = { number: "7160500039S", brand: "MEYLE" };

      await store.dispatch(fetchOffers(args));
      await store.dispatch(fetchOffers({ ...args, brand: "BOSCH" }));
      await store.dispatch(fetchOffers(args));

      expect(mockPricelistGet).toHaveBeenCalledTimes(2);
      expect(store.getState().search.selectedBrand).toBe("MEYLE");
    });

    it("после истечения срока запрашивает заново", async () => {
      vi.useFakeTimers();
      mockPricelistGet.mockResolvedValue(brandsResponse);
      await store.dispatch(fetchBrands("0189"));

      vi.advanceTimersByTime(CACHE_TTL_MS + 1);
      await store.dispatch(fetchBrands("0189"));

      expect(mockPricelistGet).toHaveBeenCalledTimes(2);
    });

    it("ошибки не кэшируются", async () => {
      mockPricelistGet.mockRejectedValueOnce(new Error("boom")).mockResolvedValueOnce(brandsResponse);

      await store.dispatch(fetchBrands("0189"));
      await store.dispatch(fetchBrands("0189"));

      expect(mockPricelistGet).toHaveBeenCalledTimes(2);
      expect(store.getState().search.brands.status).toBe("succeeded");
    });
  });
});
