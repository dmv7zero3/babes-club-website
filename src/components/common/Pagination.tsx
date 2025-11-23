import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import clsx from "clsx";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageNumbers: (number | string)[];
  onPageChange: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onFirstPage: () => void;
  onLastPage: () => void;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  className?: string;
  showFirstLast?: boolean;
  ariaLabel?: string;
}

const Pagination = ({
  currentPage,
  totalPages,
  pageNumbers,
  onPageChange,
  onPreviousPage,
  onNextPage,
  onFirstPage,
  onLastPage,
  hasNextPage,
  hasPreviousPage,
  className,
  showFirstLast = true,
  ariaLabel = "Pagination navigation",
}: PaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className={clsx("flex items-center justify-center gap-2", className)}
      role="navigation"
      aria-label={ariaLabel}
    >
      {/* First Page Button */}
      {showFirstLast && (
        <button
          type="button"
          onClick={onFirstPage}
          disabled={!hasPreviousPage}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cotton-candy"
          aria-label="Go to first page"
        >
          <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      {/* Previous Page Button */}
      <button
        type="button"
        onClick={onPreviousPage}
        disabled={!hasPreviousPage}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cotton-candy"
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((pageNumber, index) => {
          if (pageNumber === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex h-9 w-9 items-center justify-center text-neutral-500"
                aria-hidden="true"
              >
                …
              </span>
            );
          }

          const page = pageNumber as number;
          const isActive = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={clsx(
                "flex h-9 min-w-[2.25rem] items-center justify-center rounded-md px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cotton-candy",
                isActive
                  ? "bg-black text-white"
                  : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
              )}
              aria-label={`Go to page ${page}`}
              aria-current={isActive ? "page" : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Next Page Button */}
      <button
        type="button"
        onClick={onNextPage}
        disabled={!hasNextPage}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cotton-candy"
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Last Page Button */}
      {showFirstLast && (
        <button
          type="button"
          onClick={onLastPage}
          disabled={!hasNextPage}
          className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cotton-candy"
          aria-label="Go to last page"
        >
          <ChevronsRight className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

      {/* Screen reader status */}
      <div
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Page {currentPage} of {totalPages}
      </div>
    </nav>
  );
};

export default Pagination;
