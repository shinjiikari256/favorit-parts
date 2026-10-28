import { cva } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full outline-none transition-all focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      size: {
        lg: "text-conte-button-l h-12 px-6",
        sm: "text-conte-button-m h-7 px-4",
      },
      variant: {
        default:
          "border border-primary bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:bg-primary-focus",
        outline: "border border-primary bg-transparent text-primary hover:bg-light-primary",
      },
    },
    defaultVariants: { variant: "default", size: "lg" },
  },
);

/**
 * Кнопка. В состоянии `loading` показывает спиннер и блокируется.
 * @param {React.ComponentProps<"button"> & {
 *   variant?: "default"|"outline",
 *   size?: "lg"|"sm",
 *   loading?: boolean
 * }} props `variant` — вариант (по умолчанию `default`), `size` — размер (по умолчанию `lg`),
 *   `loading` — идёт загрузка; `type` по умолчанию `button`; остальные пропсы уходят в `<button>`.
 * @returns {JSX.Element}
 */
export const Button = ({ className, variant, size, loading, disabled, type = "button", children, ...props }) => (
  <button
    data-slot="button"
    type={type}
    disabled={loading || disabled}
    className={cn(buttonVariants({ variant, size }), loading && "disabled:opacity-100", className)}
    {...props}
  >
    {loading && <Loader2 className="motion-safe:animate-spin" />}
    {children}
  </button>
);
