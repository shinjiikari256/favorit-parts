# Favorit Parts — подбор запчастей

Клиент для веб-сервиса «Проценка» (`wsprice.pdf`). Двухэтапный подбор:

1. Вводим артикул → сервис возвращает список производителей.
2. Выбираем производителя → получаем искомую деталь и аналоги: название/производитель, цена, остаток.

Стек: React 19, Redux Toolkit, Tailwind CSS 4, i18next (ru/en), orval (OpenAPI → axios-клиент), Vite, Vitest + Testing Library, Playwright. Без TypeScript. Менеджер пакетов — bun, Node 24 (`.nvmrc`, `engines`).

## Запуск

```bash
bun install
cp .env.example .env.local   # при необходимости поменять ключ покупателя VITE_API_KEY
bun run dev               # http://localhost:5175
```

В `.env.example` лежит тестовый ключ из документации (`00000000-0000-0000-0000-000000000001`).

### Переменные API

| Переменная     | Назначение                                                              |
| -------------- | ----------------------------------------------------------------------- |
| `VITE_API_URL` | базовый URL сервиса: `https://api.favorit-parts.ru` (и в dev, и в prod) |
| `VITE_API_KEY` | ключ покупателя (тестовый — из документации)                            |

Прокси нет: браузер обращается к API напрямую (и в dev, и в prod), поэтому сервис должен отдавать CORS-заголовки — сейчас он отдаёт `Access-Control-Allow-Origin: *`. Файлы `.env.dev` и `.env.prod` лежат в git намеренно: в них только тестовый ключ из документации.

## Скрипты

| Команда                                      | Что делает                                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------------------- |
| `bun run dev` / `build` / `preview`          | разработка, сборка, предпросмотр                                                    |
| `bun run lint` / `format`                    | ESLint / Prettier (`format:check` — проверка без записи)                            |
| `bun run test:unit` / `test:coverage`        | unit-тесты (Vitest), с отчётом о покрытии                                           |
| `bun run test:e2e`                           | сквозные сценарии (Playwright, поднимает dev-сервер сам)                            |
| `bun run test:ui`                            | проверки вёрстки и доступности (Playwright)                                         |
| `bun run test:unit:report`                   | unit-тесты с покрытием, затем открывает HTML-отчёт (`.vitest/`)                     |
| `bun run test:unit:ui`                       | интерактивный интерфейс Vitest (watch)                                              |
| `bun run test:e2e:report` / `test:ui:report` | то же, затем открывает HTML-отчёт (`playwright-report/e2e`, `playwright-report/ui`) |
| `bun run gen:api`                            | генерация API-клиента из `orval/favorit-parts-openapi.yaml`                         |
| `bun run i18n:lint`                          | проверка yaml-переводов                                                             |

## Проверки и деплой

`pre-commit` гоняет lint-staged. `pre-push` (husky) выполняет `format:check`, `lint`, `i18n:lint`, `test:coverage`, `build` и `test:e2e`. Отдельного CI нет. Деплой — Vercel через Git-интеграцию.

## API-клиент (orval)

OpenAPI-описание составлено вручную по PDF: `orval/favorit-parts-openapi.yaml`.
`bun run gen:api` запускает orval, затем `scripts/gen-api.js` переводит сгенерированный `.ts` в `.js` (esbuild) и удаляет типы — результат лежит в `src/api/rest/endpoints/` и коммитится. Ключ покупателя и обработка `{ "error": ... }` — в `src/api/rest/axios.js`.

## Структура

```ini
orval/            OpenAPI-спецификация и конфиг orval
scripts/          gen-api.js
src/
  api/rest/       axios-мутатор, коды ошибок, сгенерированные endpoints
  components/
    ui/           базовые компоненты (shadcn-стиль): Button, Input, Table, Alert…
    composite/    AppSkeleton, ApiErrorAlert, AppErrorBoundary, настройки (ключ API, оформление)
    pages/            SearchPage (только страница)
    composite/search/  SearchForm, BrandList, OffersTable (строки, карточки, виртуализация)
  config/         конфигурация API
  locales/        переводы (yaml)
  store/search/   Redux: slice, thunks, нормализация ответов, селекторы
  styles/         Tailwind, токены; themes/ — палитры (palettes.css) и стили оформления с их поверхностями (styles/*.css)
tests/unit/       unit-тесты нормализации, store, страницы и компонентов
tests/e2e/scenarios/  сквозные сценарии пользователя (Playwright)
tests/e2e/visual/     вёрстка и доступность: контраст, размеры целей, раскладка, виртуализация
```
