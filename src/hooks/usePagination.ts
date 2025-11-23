import { useState, useMemo } from "react";

export interface PaginationConfig {
  totalItems: number;
  itemsPerPage: number;
  initialPage?: number;
  siblingCount?: number;
}

export interface PaginationResult<T> {
  currentPage: number;
  totalPages: number;
  pageData: T[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  pageNumbers: (number | string)[];
  startIndex: number;
  endIndex: number;
}

export function usePagination<T>(
  data: T[],
  config: PaginationConfig
): PaginationResult<T> {
  const {
    totalItems,
    itemsPerPage,
    initialPage = 1,
    siblingCount = 1,
  } = config;

  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Calculate page range
  const { startIndex, endIndex } = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, totalItems);
    return { startIndex: start, endIndex: end };
  }, [currentPage, itemsPerPage, totalItems]);

  // Get current page data
  const pageData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  // Generate page numbers with ellipsis
  const pageNumbers = useMemo(() => {
    const range = (start: number, end: number) => {
      const length = end - start + 1;
      return Array.from({ length }, (_, idx) => idx + start);
    };

    const totalPageNumbers = siblingCount * 2 + 5; // siblings + first + last + current + 2 ellipsis

    if (totalPageNumbers >= totalPages) {
      return range(1, totalPages);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = range(1, leftItemCount);
      return [...leftRange, "...", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = range(totalPages - rightItemCount + 1, totalPages);
      return [firstPageIndex, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = range(leftSiblingIndex, rightSiblingIndex);
      return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
    }

    return range(1, totalPages);
  }, [currentPage, totalPages, siblingCount]);

  const goToPage = (page: number) => {
    const pageNumber = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(pageNumber);
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const previousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);

  return {
    currentPage,
    totalPages,
    pageData,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1,
    goToPage,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    pageNumbers,
    startIndex,
    endIndex,
  };
}
