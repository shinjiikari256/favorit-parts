import { SearchX } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Пустое состояние: запрос прошёл успешно, но показывать нечего.
 * @param {Omit<React.ComponentProps<"div">, "title"> & {
 *   icon?: React.ReactNode,
 *   title?: React.ReactNode,
 *   action?: React.ReactNode,
 * }} props
 *   `icon` — иконка над текстом (по умолчанию `SearchX`, `null` убирает); `title` — заголовок;
 *   `children` — пояснение; `action` — кнопка или ссылка под текстом; остальные пропсы уходят в `<div>`.
 * @returns {JSX.Element}
 */
export const EmptyState = ({ className, icon = <SearchX />, title, action, children, ...props }) => (
  <div
    data-slot="empty-state"
    className={cn("flex flex-col items-center gap-2 py-8 text-center text-muted-foreground", className)}
    {...props}
  >
    {icon && (
      <span aria-hidden className="[&>svg]:size-8">
        {icon}
      </span>
    )}
    {title && <p className="text-conte-body-m font-bold text-foreground">{title}</p>}
    {children && <div className="text-conte-body-m">{children}</div>}
    {action && <div className="mt-2">{action}</div>}
  </div>
);
