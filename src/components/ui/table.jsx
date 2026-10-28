import { cn } from "@/lib/utils";

/**
 * Таблица в контейнере с горизонтальной прокруткой.
 * @param {React.ComponentProps<"table"> & { containerClassName?: string }} props
 *   `containerClassName` — классы обёртки; остальные пропсы уходят в `<table>`.
 * @returns {JSX.Element}
 */
export const Table = ({ className, containerClassName, ...props }) => (
  <div data-slot="table-container" className={cn("w-full overflow-x-auto", containerClassName)}>
    <table data-slot="table" className={cn("w-full caption-bottom text-sm", className)} {...props} />
  </div>
);

/** Шапка таблицы (`<thead>`). @param {React.ComponentProps<"thead">} props @returns {JSX.Element} */
export const TableHeader = ({ className, ...props }) => (
  <thead data-slot="table-header" className={cn("border-y border-border", className)} {...props} />
);

/** Тело таблицы (`<tbody>`). @param {React.ComponentProps<"tbody">} props @returns {JSX.Element} */
export const TableBody = ({ className, ...props }) => (
  <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);

/** Строка таблицы (`<tr>`). @param {React.ComponentProps<"tr">} props @returns {JSX.Element} */
export const TableRow = ({ className, ...props }) => (
  <tr
    data-slot="table-row"
    className={cn("border-b border-border transition-colors hover:bg-accent/50", className)}
    {...props}
  />
);

/** Ячейка заголовка столбца (`<th scope="col">`). @param {React.ComponentProps<"th">} props @returns {JSX.Element} */
export const TableHead = ({ className, ...props }) => (
  <th
    scope="col"
    data-slot="table-head"
    className={cn("h-11 px-3 text-left align-middle font-bold whitespace-nowrap text-muted-foreground", className)}
    {...props}
  />
);

/** Ячейка таблицы (`<td>`). @param {React.ComponentProps<"td">} props @returns {JSX.Element} */
export const TableCell = ({ className, ...props }) => (
  <td data-slot="table-cell" className={cn("px-3 py-3 align-middle", className)} {...props} />
);
