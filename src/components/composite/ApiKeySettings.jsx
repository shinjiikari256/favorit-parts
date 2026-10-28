import { memo, useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";

import { KeyRound, X } from "lucide-react";

import { Input } from "@/components/ui";
import { API_KEY, getCustomApiKey, setCustomApiKey } from "@/config/api";
import { cn } from "@/lib/utils";
import { restartSearch } from "@/store/search/searchSlice";

import { Section, SettingsPopover } from "./SettingsPopover";

/** Длины групп UUID. */
const KEY_GROUPS = [8, 4, 4, 4, 12];
/** Полный ключ: UUID 8-4-4-4-12, hex, нижний регистр. */
const KEY_PATTERN = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/;
/** Подсказка в поле, когда ключа по умолчанию нет. */
const EMPTY_MASK = "00000000-0000-0000-0000-000000000000";

/**
 * Приводит ввод к формату UUID, как у ключа по умолчанию: 8-4-4-4-12, hex, нижний регистр.
 * Посторонние символы отбрасываются, длина ограничивается 32 hex-символами, дефисы расставляются сами.
 * @param {string} raw Сырой ввод пользователя.
 * @returns {string} Отформатированный (возможно, неполный) ключ.
 */
const formatKey = (raw) => {
  const hex = raw
    .toLowerCase()
    .replace(/[^0-9a-f]/g, "")
    .slice(0, 32);
  let start = 0;
  return KEY_GROUPS.map((size) => hex.slice(start, (start += size)))
    .filter(Boolean)
    .join("-");
};

/**
 * Свой ключ API вместо ключа по умолчанию; пустое поле (или крестик) — ключ по умолчанию, свой ключ удаляется.
 * Неполный ключ не сохраняется. Ключ применяется по потере фокуса, Enter или крестику: сохраняется в `localStorage`
 * и перезапускает текущий поиск.
 * @returns {JSX.Element}
 */
export const ApiKeySettings = memo(() => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const messageId = useId();
  const [value, setValue] = useState(() => formatKey(getCustomApiKey() ?? ""));
  const [applied, setApplied] = useState(false);

  const invalid = value !== "" && !KEY_PATTERN.test(value);

  const handleChange = (event) => {
    setValue(formatKey(event.target.value));
    setApplied(false);
  };

  const apply = (next) => {
    if (next === (getCustomApiKey() ?? "")) return;
    setCustomApiKey(next || null);
    dispatch(restartSearch());
    setApplied(true);
  };

  const commit = () => !invalid && apply(value);

  const clear = () => {
    setValue("");
    apply("");
  };

  return (
    <SettingsPopover icon={<KeyRound className="size-5" />} label={t("settings.apiKey")} className="w-[24rem]">
      <Section title={t("settings.apiKeyLabel")}>
        <div className="relative">
          <Input
            value={value}
            placeholder={API_KEY || EMPTY_MASK}
            maxLength={36}
            spellCheck={false}
            autoComplete="off"
            aria-label={t("settings.apiKeyLabel")}
            aria-invalid={invalid}
            aria-describedby={messageId}
            onChange={handleChange}
            onBlur={commit}
            onKeyDown={(event) => event.key === "Enter" && commit()}
            className={cn("h-8 px-3 font-mono text-[13px]!", value && "pr-9")}
          />
          {value && (
            <button
              type="button"
              onClick={clear}
              aria-label={t("settings.apiKeyClear")}
              title={t("settings.apiKeyClear")}
              className="absolute top-1/2 right-1 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <p
          id={messageId}
          role={invalid || applied ? "status" : undefined}
          className={invalid ? "text-conte-body-s text-destructive" : "text-conte-body-s text-muted-foreground"}
        >
          {invalid ? t("settings.apiKeyInvalid") : applied ? t("settings.apiKeyApplied") : t("settings.apiKeyHint")}
        </p>
      </Section>
    </SettingsPopover>
  );
});
