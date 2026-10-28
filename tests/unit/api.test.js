import { api, instance } from "@/api/rest/axios";
import { API_ERROR, ApiError, parseApiErrorCode } from "@/api/rest/errors";
import { setCustomApiKey } from "@/config/api";

const respond =
  (data, status = 200) =>
  (config) =>
    status < 400
      ? Promise.resolve({ data, status, statusText: "", headers: {}, config })
      : Promise.reject(Object.assign(new Error(`HTTP ${status}`), { config, response: { data, status } }));

const useAdapter = (adapter) => {
  instance.defaults.adapter = adapter;
};

afterEach(() => {
  localStorage.clear();
});

describe("parseApiErrorCode", () => {
  it.each([
    ["Empty key!", API_ERROR.EMPTY_KEY],
    ["Invalid key client!", API_ERROR.INVALID_KEY],
    ["Invalid access key", API_ERROR.INVALID_KEY],
    ["Empty number goods!", API_ERROR.EMPTY_NUMBER],
    ["Request quota exceeded!", API_ERROR.QUOTA],
    ["что-то новое", API_ERROR.UNKNOWN],
    [undefined, API_ERROR.UNKNOWN],
  ])("«%s» → %s", (message, code) => {
    expect(parseApiErrorCode(message)).toBe(code);
  });
});

describe("axios-клиент", () => {
  it("подставляет ключ в запрос: пользовательский приоритетнее ключа по умолчанию", async () => {
    const adapter = vi.fn(respond({ goods: [] }));
    useAdapter(adapter);
    setCustomApiKey("custom-key");

    await api({ url: "/hs/hsprice/", params: { number: "1" } });

    expect(adapter.mock.calls[0][0].params).toEqual({ key: "custom-key", number: "1" });
  });

  it("возвращает тело успешного ответа", async () => {
    useAdapter(respond({ goods: [1] }));
    await expect(api({ url: "/" })).resolves.toEqual({ goods: [1] });
  });

  it("ошибка в теле ответа 200 → ApiError с кодом", async () => {
    useAdapter(respond({ error: "Invalid key client!" }));
    await expect(api({ url: "/" })).rejects.toMatchObject({ name: "ApiError", code: API_ERROR.INVALID_KEY });
  });

  it("HTML вместо JSON → ApiError unknown, а не пустая выдача", async () => {
    useAdapter(respond("<!doctype html><html></html>"));
    const error = await api({ url: "/" }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe(API_ERROR.UNKNOWN);
  });

  it("пустое тело (null) → ApiError unknown", async () => {
    useAdapter(respond(null));
    await expect(api({ url: "/" })).rejects.toMatchObject({ code: API_ERROR.UNKNOWN });
  });

  it("HTTP-ошибка с { error } в теле → код из текста", async () => {
    useAdapter(respond({ error: "Request quota exceeded!" }, 429));
    await expect(api({ url: "/" })).rejects.toMatchObject({ code: API_ERROR.QUOTA });
  });

  it("HTTP-ошибка без тела → unknown", async () => {
    useAdapter(respond({}, 500));
    await expect(api({ url: "/" })).rejects.toMatchObject({ code: API_ERROR.UNKNOWN });
  });

  it("сбой сети (нет ответа) → network", async () => {
    useAdapter((config) => Promise.reject(Object.assign(new Error("Network Error"), { config })));
    await expect(api({ url: "/" })).rejects.toMatchObject({ code: API_ERROR.NETWORK });
  });
});
