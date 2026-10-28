/** Общий мок сервиса цен для unit-тестов; сбрасывается перед каждым тестом (`mockReset` в vitest.config). */
export const mockPricelistGet = vi.fn();

vi.mock("@/api/rest/endpoints/price/price", () => ({ getPrice: () => ({ pricelistGet: mockPricelistGet }) }));
