import { useTranslation } from "react-i18next";

import { Skeleton, Table, TableBody, TableCell, TableRow } from "@/components/ui";
import { useMinWidth } from "@/hooks/useMinWidth";

import { OffersTableHeader } from "./OffersTableHeader";

/**
 * Скелетон на месте OffersTable: настоящая шапка и строки с теми же ячейками (бренд + бейдж, название, номер, цена, остаток).
 * На узких экранах вместо таблицы — до трёх карточек.
 * @param {object} props
 * @param {number} [props.rows=4] Число строк-заглушек.
 * @returns {JSX.Element}
 */
export const OffersTableSkeleton = ({ rows = 4 }) => {
  const { t } = useTranslation("search");
  const wide = useMinWidth("tablet");

  if (!wide) {
    return (
      <div data-testid="loader" role="status" aria-busy="true" className="flex flex-col gap-3">
        <span className="sr-only">{t("loading")}</span>
        {Array.from({ length: Math.min(rows, 3) }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3.5 w-1/3" />
            <div className="flex justify-between">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div data-testid="loader" role="status" aria-busy="true">
      <span className="sr-only">{t("loading")}</span>
      <Table>
        <OffersTableHeader />
        <TableBody>
          {Array.from({ length: rows }, (_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              <TableCell />
              <TableCell>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="my-[3px] h-3.5 w-3/4" />
                <Skeleton className="my-[3px] h-3.5 w-1/3" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="ml-auto h-4 w-12" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
