import { useTranslation } from "react-i18next";

import { API_ERROR } from "@/api/rest/errors";
import { ErrorAlert } from "@/components/ui";

/** Коды, при которых повтор ничего не изменит: нужно исправить ключ или номер. */
const FIX_FIRST = new Set([API_ERROR.EMPTY_KEY, API_ERROR.INVALID_KEY, API_ERROR.EMPTY_NUMBER]);

/**
 * Ошибка запроса к API. Для ошибок ключа и номера вместо кнопки повтора показывается подсказка, что исправить.
 * @param {object} props
 * @param {import("@/api/rest/errors").API_ERROR} props.code Код ошибки; неизвестный показывается как `unknown`.
 * @param {() => void} [props.onRetry] Повторить запрос; без него кнопка не рисуется.
 * @returns {JSX.Element}
 */
export const ApiErrorAlert = ({ code, onRetry }) => {
  const { t } = useTranslation("search");
  const fixFirst = FIX_FIRST.has(code);

  return (
    <ErrorAlert
      title={t("errors.title")}
      message={t(`errors.${code}`, { defaultValue: t("errors.unknown") })}
      hint={fixFirst ? t(`errors.fix.${code}`) : undefined}
      onRetry={fixFirst ? undefined : onRetry}
      retryLabel={t("retry")}
    />
  );
};
