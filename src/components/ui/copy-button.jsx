import { useState } from "react";

import { Check, Copy, X } from "lucide-react";

/**
 * Доступен ли Clipboard API (нужен secure context).
 * @returns {boolean}
 */
const canCopy = () => typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function";

/**
 * Копирует текст в буфер обмена.
 * @param {string} value Текст.
 * @returns {Promise<boolean>} `false`, если браузер отказал в записи.
 */
const copyText = async (value) => {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

/**
 * Копирует значение в буфер обмена; на секунду показывает галочку, при неудаче — крестик.
 * Без Clipboard API ничего не рисует. Подписи задаёт вызывающий код.
 * @param {object} props
 * @param {string} props.value Копируемый текст.
 * @param {string} props.label Подпись кнопки.
 * @param {string} props.copiedLabel Подпись после успешного копирования.
 * @param {string} props.failedLabel Подпись, если браузер отказал в записи.
 * @returns {JSX.Element|null}
 */
export const CopyButton = ({ value, label, copiedLabel, failedLabel }) => {
  const [result, setResult] = useState(null);
  if (!canCopy()) return null;

  const copy = async () => {
    setResult((await copyText(value)) ? "copied" : "failed");
    setTimeout(() => setResult(null), 1500);
  };

  const current = result === "copied" ? copiedLabel : result === "failed" ? failedLabel : label;

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={current}
      title={current}
      className="flex size-6 cursor-pointer items-center justify-center rounded-md outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
    >
      {result === "copied" && <Check className="size-3.5 text-primary" />}
      {result === "failed" && <X className="size-3.5 text-destructive" />}
      {result === null && <Copy className="size-3.5" />}
    </button>
  );
};
