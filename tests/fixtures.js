// Примеры ответов из документации wsprice.pdf

let warehouseSeq = 0;

// id склада уникален в пределах фикстур: по нему строится key строки склада
const warehouse = (price, stock) => ({
  code: "МС2",
  id: `wh-${++warehouseSeq}`,
  own: false,
  price,
  stock,
  shipmentDate: "2019-05-31T15:30:00+03:00",
});

export const emptyGoods = {
  goodsID: "00000000-0000-0000-0000-000000000000",
  brand: "",
  number: "",
  name: "",
  count: 0,
  price: 0,
  rate: 0,
  warehouses: [],
};

export const brandsResponse = {
  goods: [
    {
      goodsID: "id-zen",
      brand: "ZEN",
      number: "0189",
      name: "Бендикс",
      count: 6,
      price: 367.01,
      rate: 1,
      warehouses: [warehouse(367.01, 6)],
    },
    {
      goodsID: "id-ngk",
      brand: "NGK/NTK",
      number: "0189",
      name: "Хомбец-90мд",
      count: 0,
      price: 0,
      rate: 1,
      warehouses: [],
    },
    {
      goodsID: "id-caf",
      brand: "CAFFARO",
      number: "03-89",
      name: "Ролик п/клин. ремня",
      count: 4,
      price: 429.96,
      rate: 1,
      warehouses: [warehouse(429.96, 4)],
    },
  ],
};

export const offersResponse = {
  goods: [
    {
      goodsID: "id-origin",
      brand: "MEYLE",
      number: "7160500039/S",
      name: "Рычаги задней подвески",
      count: 20,
      price: 12533.62,
      rate: 1,
      warehouses: [warehouse(12533.62, 20)],
      analogues: [
        {
          goodsID: "id-a1",
          brand: "Mapco",
          number: "53612/1",
          name: "Комплект рычагов",
          count: 10,
          price: 8680.2,
          rate: 1,
          warehouses: [warehouse(9000, 4), warehouse(8680.2, 6), warehouse(100, 0)],
        },
        {
          goodsID: "id-a2",
          brand: "MEYLE",
          number: "7160500039/SK",
          name: "Рычаги задней подвески (1 сторона)",
          count: 0,
          price: 0,
          rate: 1,
          warehouses: [],
        },
      ],
    },
  ],
};
