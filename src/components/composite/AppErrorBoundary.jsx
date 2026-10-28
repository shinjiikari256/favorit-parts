import { useTranslation } from "react-i18next";

import { Alert, Button, ErrorBoundary } from "@/components/ui";

/**
 * Запасной экран приложения: сообщение и кнопка перезагрузки страницы.
 * @returns {JSX.Element}
 */
const AppFallback = () => {
  const { t } = useTranslation("search");

  return (
    <Alert variant="error" title={t("errors.boundary")}>
      <Button size="sm" variant="outline" className="mt-3" onClick={() => window.location.reload()}>
        {t("errors.reload")}
      </Button>
    </Alert>
  );
};

/**
 * Граница ошибок приложения с переведённым запасным экраном.
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export const AppErrorBoundary = ({ children }) => <ErrorBoundary fallback={<AppFallback />}>{children}</ErrorBoundary>;
