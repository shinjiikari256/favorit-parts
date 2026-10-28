import { cn } from "@/lib/utils";

/**
 * Заглушка-плейсхолдер на время загрузки; размеры задаются через `className`.
 * @param {React.ComponentProps<"div">} props
 * @returns {JSX.Element}
 */
export const Skeleton = ({ className, ...props }) => (
  <div
    data-slot="skeleton"
    className={cn("w-full motion-safe:animate-pulse rounded-md bg-skeleton", className)}
    {...props}
  />
);
