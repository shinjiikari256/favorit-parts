import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Секция внутри панели настроек: подпись и содержимое.
 * @param {object} props
 * @param {React.ReactNode} props.title Подпись секции.
 * @param {React.ReactNode} props.children Элементы управления.
 * @returns {JSX.Element}
 */
export const Section = ({ title, children }) => (
  <div className="flex flex-col gap-1.5">
    <p className="text-conte-body-s font-bold text-muted-foreground">{title}</p>
    {children}
  </div>
);

/**
 * Иконка в шапке без рамки (семантически кнопка) (подпись — в aria-label и title) с выпадашкой.
 * Фокус уходит в панель при открытии; Escape закрывает панель и возвращает фокус на кнопку,
 * клик снаружи и Tab за пределы панели просто закрывают её.
 * @param {object} props
 * @param {React.ReactNode} props.icon Иконка кнопки.
 * @param {string} props.label Подпись кнопки и панели (`aria-label`, `title`).
 * @param {string} [props.className] Дополнительные классы панели (например, ширина).
 * @param {React.ReactNode} props.children Содержимое панели.
 * @returns {JSX.Element}
 */
export const SettingsPopover = ({ icon, label, className, children }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(event) => {
        if (open && !rootRef.current?.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={label}
        title={label}
        onClick={() => setOpen((v) => !v)}
        className="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-expanded:text-primary"
      >
        {icon}
      </button>

      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          tabIndex={-1}
          aria-label={label}
          className={cn(
            "absolute right-0 top-full z-50 outline-none mt-2 flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground shadow-lg",
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};
