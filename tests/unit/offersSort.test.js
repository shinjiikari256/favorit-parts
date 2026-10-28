import { findBestId, nextSort, sortOffers } from "@/components/composite/search/offersSort";

const offer = (id, price, stock) => ({ id, price, stock });

describe("findBestId", () => {
  it("возвращает предложение с минимальной ценой среди имеющихся в наличии", () => {
    expect(findBestId([offer("a", 300, 1), offer("b", 100, 2), offer("c", 50, 0)])).toBe("b");
  });

  it("без сравнения (меньше двух в наличии) лучшей цены нет", () => {
    expect(findBestId([offer("a", 300, 1), offer("b", null, 0)])).toBeNull();
    expect(findBestId([])).toBeNull();
  });
});

describe("nextSort", () => {
  it("цикл по колонке: по возрастанию → по убыванию → без сортировки", () => {
    const asc = nextSort(null, "price");
    expect(asc).toEqual({ field: "price", dir: "asc" });
    const desc = nextSort(asc, "price");
    expect(desc).toEqual({ field: "price", dir: "desc" });
    expect(nextSort(desc, "price")).toBeNull();
  });

  it("другая колонка начинает заново с возрастания", () => {
    expect(nextSort({ field: "price", dir: "desc" }, "stock")).toEqual({ field: "stock", dir: "asc" });
  });
});

describe("sortOffers", () => {
  const list = [offer("a", 300, 1), offer("none", null, 0), offer("b", 100, 5), offer("c", 200, 3)];
  const ids = (sorted) => sorted.map((o) => o.id);

  it("без сортировки возвращает исходный порядок", () => {
    expect(sortOffers(list, null)).toBe(list);
  });

  it("по цене: позиции без цены всегда внизу, в любом направлении", () => {
    expect(ids(sortOffers(list, { field: "price", dir: "asc" }))).toEqual(["b", "c", "a", "none"]);
    expect(ids(sortOffers(list, { field: "price", dir: "desc" }))).toEqual(["a", "c", "b", "none"]);
  });

  it("по остатку: позиции без остатка внизу", () => {
    expect(ids(sortOffers(list, { field: "stock", dir: "desc" }))).toEqual(["b", "c", "a", "none"]);
  });

  it("не мутирует исходный массив", () => {
    const copy = [...list];
    sortOffers(list, { field: "price", dir: "asc" });
    expect(list).toEqual(copy);
  });
});
