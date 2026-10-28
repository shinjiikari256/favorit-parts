import { Card, Skeleton } from "@/components/ui";

/**
 * Классы контейнера страницы — общие для App и скелетона, чтобы раскладка не «прыгала».
 * @type {string}
 */
export const PAGE_CLASS = "mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-6 tablet:py-10";

/**
 * Скелетон приложения на время загрузки переводов (Suspense в main.jsx): шапка и карточка поиска.
 * Размеры повторяют App/SearchPage по высоте строк; текстов нет — переводы ещё не загружены.
 * @returns {JSX.Element}
 */
export const AppSkeleton = () => (
  <div role="status" aria-busy="true" className={PAGE_CLASS}>
    <header data-role="header" className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Skeleton className="my-[3px] h-3.5 w-28" />
        <Skeleton className="my-1.5 h-8 w-72 max-w-full" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="size-5 rounded-full" />
        <Skeleton className="size-5 rounded-full" />
      </div>
    </header>
    <main>
      <Card>
        <div>
          <Skeleton className="my-1 h-5 w-48" />
          <Skeleton className="my-[3px] h-3.5 w-80 max-w-full" />
        </div>
        <div className="flex flex-col gap-2 mobile-lg:flex-row">
          <Skeleton className="h-12 rounded-md mobile-lg:flex-1" />
          <Skeleton className="h-12 rounded-full mobile-lg:w-36" />
        </div>
      </Card>
    </main>
  </div>
);
