import { getGoodsPrice, isEmptyGoods, normalizeBrands, normalizeOffers } from "@/store/search/normalize";

import { brandsResponse, emptyGoods, offersResponse } from "../fixtures";

describe("isEmptyGoods", () => {
  it("распознаёт пустую структуру «не найдено»", () => {
    expect(isEmptyGoods(emptyGoods)).toBe(true);
    expect(isEmptyGoods(undefined)).toBe(true);
  });

  it("не считает пустой деталь с брендом", () => {
    expect(isEmptyGoods(brandsResponse.goods[0])).toBe(false);
  });
});

describe("getGoodsPrice", () => {
  it("берёт минимальную цену среди складов с остатком, игнорируя goods.price и склады без остатка", () => {
    const [, analogue] = [null, ...offersResponse.goods[0].analogues];
    expect(getGoodsPrice(analogue)).toBe(8680.2);
  });

  it("возвращает null, если складов с остатком нет", () => {
    expect(getGoodsPrice({ price: 100, warehouses: [] })).toBeNull();
    expect(getGoodsPrice({ price: 100 })).toBeNull();
  });
});

describe("normalizeBrands", () => {
  it("возвращает по записи на производителя", () => {
    expect(normalizeBrands(brandsResponse).map((b) => b.brand)).toEqual(["ZEN", "NGK/NTK", "CAFFARO"]);
  });

  it("не показывает пустую структуру и дубли брендов", () => {
    expect(normalizeBrands({ goods: [emptyGoods] })).toEqual([]);
    const dup = { goods: [brandsResponse.goods[0], brandsResponse.goods[0]] };
    expect(normalizeBrands(dup)).toHaveLength(1);
  });
});

describe("normalizeOffers", () => {
  it("ставит искомую деталь первой, затем аналоги", () => {
    const offers = normalizeOffers(offersResponse);
    expect(offers.map((o) => [o.brand, o.isOrigin])).toEqual([
      ["MEYLE", true],
      ["Mapco", false],
      ["MEYLE", false],
    ]);
  });

  it("считает остаток по count, цену — по складам; без остатка цена null", () => {
    const [origin, mapco, noStock] = normalizeOffers(offersResponse);
    expect(origin).toMatchObject({ price: 12533.62, stock: 20 });
    expect(mapco).toMatchObject({ price: 8680.2, stock: 10 });
    expect(noStock).toMatchObject({ price: null, stock: 0 });
    expect(mapco.warehouses.map((w) => [w.price, w.stock])).toEqual([
      [8680.2, 6],
      [9000, 4],
    ]);
    expect(noStock.warehouses).toEqual([]);
  });

  it("для пустого ответа возвращает пустой список", () => {
    expect(normalizeOffers({ goods: [emptyGoods] })).toEqual([]);
  });
});
