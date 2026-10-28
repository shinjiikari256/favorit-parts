import { cn } from "@/lib/utils";

/**
 * Карточка-контейнер.
 * @param {React.ComponentProps<"div">} props
 * @returns {JSX.Element}
 */
export const Card = ({ className, ...props }) => (
  <div
    data-slot="card"
    className={cn(
      "flex flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground shadow-sm tablet:p-6",
      className,
    )}
    {...props}
  />
);

/**
 * Заголовок карточки (`<h2>`).
 * @param {React.ComponentProps<"h2">} props
 * @returns {JSX.Element}
 */
export const CardTitle = ({ className, ...props }) => (
  <h2 data-slot="card-title" className={cn("text-conte-heading3", className)} {...props} />
);

/**
 * Пояснение под заголовком карточки.
 * @param {React.ComponentProps<"p">} props
 * @returns {JSX.Element}
 */
export const CardDescription = ({ className, ...props }) => (
  <p data-slot="card-description" className={cn("text-conte-body-s text-muted-foreground", className)} {...props} />
);
