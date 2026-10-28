import { useTranslation } from "react-i18next";

import { ChevronDown } from "lucide-react";

import { Badge, CopyButton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/utils";

/**
 * Заполнитель для отсутствующего значения.
 * @type {string}
 */
export const EMPTY = "—";

/**
 * Раскрывается ли предложение: склады показываются списком, если их больше одного.
 * @param {import("@/store/search/normalize").Offer} offer Предложение.
 * @returns {boolean}
 */
export const isExpandable = (offer) => offer.warehouses.length > 1;

/**
 * Цена в рублях в формате текущего языка; `null` — прочерк.
 * @param {object} props
 * @param {number|null} props.price Цена, ₽.
 * @returns {JSX.Element|string}
 */
export const Price = ({ price }) => {
  const { i18n } = useTranslation("search");
  return price === null ? (
    <span className="font-normal text-muted-foreground">{EMPTY}</span>
  ) : (
    formatPrice(price, i18n.language)
  );
};

// сервис отдаёт срок со смещением +03:00; показываем в зоне браузера, а время по МСК — во всплывающей подсказке
/** Часовой пояс сервиса. */
const SERVICE_TIME_ZONE = "Europe/Moscow";
// getTimezoneOffset() для UTC+3
/** Смещение зоны сервиса в минутах, как его возвращает `getTimezoneOffset()`. */
const SERVICE_UTC_OFFSET_MIN = -180;
/** Формат времени «ЧЧ:ММ». */
const TIME_FORMAT = { hour: "2-digit", minute: "2-digit" };

/** Форматтеры времени с названием зоны: `Intl.DateTimeFormat` дорого создавать на каждую строку. */
const zonedTimeFormats = new Map();
const zonedTimeFormat = (language, offset) => {
  const key = `${language}|${offset}`;
  if (!zonedTimeFormats.has(key))
    zonedTimeFormats.set(key, new Intl.DateTimeFormat(language, { ...TIME_FORMAT, timeZoneName: "short" }));
  return zonedTimeFormats.get(key);
};

/**
 * Срок отгрузки: дата и время в зоне браузера; если она не совпадает с зоной сервиса,
 * показывается её название, а время по Москве — во всплывающей подсказке.
 * @param {object} props
 * @param {string|null} [props.date] Дата в ISO 8601 (со смещением +03:00).
 * @returns {JSX.Element|null} `null`, если даты нет или она некорректна.
 */
export const Shipment = ({ date }) => {
  const { t, i18n } = useTranslation("search");
  const value = date ? new Date(date) : null;
  if (!value || Number.isNaN(value.getTime())) return null;
  const parts = zonedTimeFormat(i18n.language, value.getTimezoneOffset()).formatToParts(value);
  const isServiceOffset = value.getTimezoneOffset() === SERVICE_UTC_OFFSET_MIN;
  const zone = isServiceOffset ? "" : (parts.find((p) => p.type === "timeZoneName")?.value ?? "");
  const time = parts
    .filter((p) => p.type !== "timeZoneName")
    .map((p) => p.value)
    .join("")
    .trim();
  return (
    <span
      title={
        isServiceOffset
          ? undefined
          : t("offers.warehouse.moscowTime", {
              time: value.toLocaleTimeString(i18n.language, { ...TIME_FORMAT, timeZone: SERVICE_TIME_ZONE }),
            })
      }
    >
      {t("offers.warehouse.shipmentValue", {
        date: value.toLocaleDateString(i18n.language, { day: "numeric", month: "short" }),
        time,
        tz: zone,
      }).trim()}
    </span>
  );
};

/**
 * Бейджи предложения: «Искомая деталь»/«Аналог» и «Лучшая цена».
 * @param {object} props
 * @param {import("@/store/search/normalize").Offer} props.offer Предложение.
 * @param {boolean} props.best Самая выгодная цена.
 * @returns {JSX.Element}
 */
export const Tags = ({ offer, best }) => {
  const { t } = useTranslation("search");
  return (
    <>
      <Badge variant={offer.isOrigin ? "default" : "secondary"}>
        {offer.isOrigin ? t("offers.origin") : t("offers.analogue")}
      </Badge>
      {best && (
        <Badge variant="outline" className="border-primary text-primary">
          {t("offers.best")}
        </Badge>
      )}
    </>
  );
};

/** Склад: название, код, бейджи и срок отгрузки — общий блок для строки таблицы и карточки.
 * @param {object} props
 * @param {import("@/store/search/normalize").OfferWarehouse} props.warehouse Склад.
 * @returns {JSX.Element}
 */
export const WarehouseInfo = ({ warehouse: w }) => {
  const { t } = useTranslation("search");
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="font-bold">
          {t("offers.warehouse.name")}: {w.code ?? w.id}
        </span>
        {w.code && <span className="text-conte-body-s text-muted-foreground">| {w.id}</span>}
        {w.own && <Badge variant="secondary">{t("offers.warehouse.own")}</Badge>}
      </div>
      <div className="text-conte-body-s text-muted-foreground">
        <Shipment date={w.shipmentDate} />
      </div>
    </>
  );
};

/**
 * Артикул с кнопкой копирования.
 * @param {object} props
 * @param {string} props.number Артикул.
 * @returns {JSX.Element}
 */
export const OfferNumber = ({ number }) => {
  const { t } = useTranslation("search");
  return (
    <div className="flex items-center gap-1 text-conte-body-s text-muted-foreground">
      {t("offers.number", { number })}
      <CopyButton
        value={number}
        label={t("offers.copy")}
        copiedLabel={t("offers.copied")}
        failedLabel={t("offers.copyFailed")}
      />
    </div>
  );
};

/**
 * Кнопка раскрытия списка складов; у предложения с одним складом ничего не рисует.
 * @param {object} props
 * @param {import("@/store/search/normalize").Offer} props.offer Предложение.
 * @param {boolean} props.open Список складов раскрыт.
 * @param {(id: string) => void} props.onToggle Переключить раскрытие по `id` предложения.
 * @param {string} [props.controls] `id` раскрываемого списка (`aria-controls`).
 * @param {boolean} [props.compact] Только иконка (для строки таблицы); иначе — кнопка с подписью (для карточки).
 * @returns {JSX.Element|null}
 */
export const WarehouseToggle = ({ offer, open, onToggle, controls, compact }) => {
  const { t } = useTranslation("search");
  if (!isExpandable(offer)) return null;
  const label = t("offers.warehouse.toggle", { count: offer.warehouses.length });
  const chevron = <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />;

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls={controls}
      aria-label={compact ? label : undefined}
      onClick={() => onToggle(offer.id)}
      className={cn(
        "cursor-pointer outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50",
        compact
          ? "flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
          : "flex h-9 items-center justify-between rounded-md border px-3 text-conte-body-s hover:border-primary",
      )}
    >
      {!compact && label}
      {chevron}
    </button>
  );
};
