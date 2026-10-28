import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Moon, Palette, Sun } from "lucide-react";

import { PALETTES, STYLES } from "@/hooks/useTheme";
import { cn } from "@/lib/utils";

import { Section, SettingsPopover } from "./SettingsPopover";

/**
 * Группа взаимоисключающих кнопок (состояние отражается в `aria-pressed`).
 * @param {object} props
 * @param {Array<{ id: string, label: string, icon?: React.ReactNode }>} props.options Варианты выбора.
 * @param {string} props.value `id` выбранного варианта.
 * @param {(id: string) => void} props.onChange Вызывается с `id` нажатого варианта.
 * @returns {JSX.Element}
 */
const Segmented = ({ options, value, onChange }) => (
  <div className="flex flex-wrap gap-1">
    {options.map(({ id, label, icon }) => (
      <button
        key={id}
        type="button"
        aria-pressed={value === id}
        onClick={() => onChange(id)}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold transition-colors",
          "text-muted-foreground hover:border-primary aria-pressed:border-primary aria-pressed:bg-light-primary aria-pressed:text-foreground",
        )}
      >
        {icon}
        {label}
      </button>
    ))}
  </div>
);

/**
 * Круглая кнопка цвета палитры; выбранная обведена кольцом.
 * @param {object} props
 * @param {string} props.id Идентификатор палитры (по нему берётся подпись).
 * @param {string} props.color Цвет кнопки.
 * @param {boolean} props.active Палитра выбрана.
 * @param {(id: string) => void} props.onSelect Вызывается с `id` при нажатии.
 * @returns {JSX.Element}
 */
const PaletteButton = ({ id, color, active, onSelect }) => {
  const { t } = useTranslation();
  const label = t(`theme.palette.${id}`);
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={() => onSelect(id)}
      style={{ background: color }}
      className="size-6 cursor-pointer rounded-full border ring-offset-2 ring-offset-card aria-pressed:ring-2 aria-pressed:ring-foreground"
    />
  );
};

/** Варианты режима: иконки статичны, подписи переводятся в компоненте. */
const MODE_OPTIONS = [
  { id: "light", labelKey: "settings.light", icon: <Sun className="size-3.5" /> },
  { id: "dark", labelKey: "theme.dark", icon: <Moon className="size-3.5" /> },
];

/**
 * Тема: стиль, цвет и светлая/тёмная.
 * @param {object} props
 * @param {import("@/hooks/useTheme").Theme} props.theme Текущая тема.
 * @param {(patch: Partial<import("@/hooks/useTheme").Theme>) => void} props.onThemeChange Применить изменение темы.
 * @returns {JSX.Element}
 */
export const DisplaySettings = ({ theme, onThemeChange }) => {
  const { t } = useTranslation();
  const modeOptions = useMemo(() => MODE_OPTIONS.map(({ labelKey, ...o }) => ({ ...o, label: t(labelKey) })), [t]);
  const styleOptions = useMemo(() => STYLES.map((id) => ({ id, label: t(`theme.style.${id}`) })), [t]);

  return (
    <SettingsPopover icon={<Palette className="size-5" />} label={t("theme.label")} className="w-80 p-5">
      <Section title={t("settings.mode")}>
        <Segmented
          value={theme.dark ? "dark" : "light"}
          onChange={(mode) => onThemeChange({ dark: mode === "dark" })}
          options={modeOptions}
        />
      </Section>

      <Section title={t("theme.styleLabel")}>
        <Segmented value={theme.style} onChange={(style) => onThemeChange({ style })} options={styleOptions} />
      </Section>

      <Section title={t("settings.palette")}>
        <div className="flex gap-2">
          {PALETTES.map(({ id, color }) => (
            <PaletteButton
              key={id}
              id={id}
              color={color}
              active={theme.palette === id}
              onSelect={(palette) => onThemeChange({ palette })}
            />
          ))}
        </div>
      </Section>
    </SettingsPopover>
  );
};
