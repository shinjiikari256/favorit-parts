import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative flex w-full flex-wrap items-center gap-x-4 gap-y-3 rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "border-border bg-background text-primary-black",
        error: "border-error/25 bg-error/10 text-error",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

/**
 * Блок сообщения (`role="alert"`).
 * @param {object} props
 * @param {string} [props.className] Дополнительные классы.
 * @param {"default"|"error"} [props.variant="default"] Вариант оформления.
 * @param {React.ReactNode} [props.icon] Иконка слева от текста.
 * @param {React.ReactNode} [props.title] Заголовок.
 * @param {React.ReactNode} [props.action] Действие справа (на узком экране переносится под текст).
 * @param {React.ReactNode} [props.children] Описание под заголовком.
 * @returns {JSX.Element}
 */
export const Alert = ({ className, variant, icon, title, action, children, ...props }) => (
  <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props}>
    <div className="flex min-w-0 flex-1 basis-60 items-start gap-3">
      {icon && <span className="flex h-5 shrink-0 items-center [&>svg]:size-4">{icon}</span>}
      <div className="flex flex-col gap-0.5">
        {title && <p className="font-bold leading-5 tracking-tight">{title}</p>}
        {children && <div data-slot="alert-description">{children}</div>}
      </div>
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);
