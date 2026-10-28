import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui";
import { SUPPORTED_LANGUAGES } from "@/utils/language";

/**
 * Переключатель языка интерфейса. Сейчас в интерфейсе не показывается — язык всегда ru (см. i18n.js).
 * @returns {JSX.Element}
 */
export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="flex gap-1" role="group" aria-label={t("language.label")}>
      {SUPPORTED_LANGUAGES.map((lang) => (
        <Button
          key={lang}
          size="sm"
          variant={i18n.language === lang ? "default" : "outline"}
          aria-pressed={i18n.language === lang}
          onClick={() => i18n.changeLanguage(lang)}
          className="px-2.5"
        >
          {t(`language.${lang}`)}
        </Button>
      ))}
    </div>
  );
};
