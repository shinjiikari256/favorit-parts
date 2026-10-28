import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const inputVariants = cva(
  "text-conte-input w-full min-w-0 rounded-md border border-input bg-input px-3 py-1 text-foreground shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground hover:border-primary focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  {
    variants: {
      size: {
        lg: "h-12 px-4",
      },
    },
    defaultVariants: { size: "lg" },
  },
);

/**
 * Поле ввода.
 * @param {Omit<React.ComponentProps<"input">, "size"> & { size?: "lg" }} props
 *   `size` — размер (по умолчанию `lg`), `type` по умолчанию `text`; остальные пропсы уходят в `<input>`.
 * @returns {JSX.Element}
 */
export const Input = ({ className, size, type = "text", ...props }) => (
  <input type={type} data-slot="input" className={cn(inputVariants({ size }), className)} {...props} />
);
