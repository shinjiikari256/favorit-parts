import { useTranslation } from "react-i18next";

import { ApiKeySettings } from "@/components/composite/ApiKeySettings";
import { AppErrorBoundary } from "@/components/composite/AppErrorBoundary";
import { PAGE_CLASS } from "@/components/composite/AppSkeleton";
import { DisplaySettings } from "@/components/composite/DisplaySettings";
import { SearchPage } from "@/components/pages/SearchPage";
import { useTheme } from "@/hooks/useTheme";

/**
 * Корень приложения: шапка (название, настройки ключа API и темы) и страница поиска.
 * Каждая часть обёрнута в {@link AppErrorBoundary}, чтобы сбой не ронял всё приложение.
 * @returns {JSX.Element}
 */
export const App = () => {
  const { t } = useTranslation();
  const [theme, setTheme] = useTheme();

  return (
    <div className={PAGE_CLASS}>
      <header data-role="header" className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p data-role="eyebrow" className="text-conte-body-s font-bold tracking-wide text-primary uppercase">
            {t("app.subtitle")}
          </p>
          <h1 data-role="title" className="text-conte-heading1">
            {t("app.title")}
          </h1>
        </div>
        <AppErrorBoundary>
          <div className="flex flex-wrap items-center gap-3">
            <ApiKeySettings />
            <DisplaySettings theme={theme} onThemeChange={setTheme} />
          </div>
        </AppErrorBoundary>
      </header>
      <main>
        <AppErrorBoundary>
          <SearchPage />
        </AppErrorBoundary>
      </main>
    </div>
  );
};
