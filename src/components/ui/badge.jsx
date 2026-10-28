import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border px-2 py-0.5 text-xs",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-muted text-foreground",
        outline: "text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

/**
 * Небольшая метка.
 * @param {React.ComponentProps<"span"> & { variant?: "default"|"secondary"|"outline" }} props
 *   `variant` — вариант оформления (по умолчанию `default`); остальные пропсы уходят в `<span>`.
 * @returns {JSX.Element}
 */
export const Badge = ({ className, variant, ...props }) => (
  <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
);
