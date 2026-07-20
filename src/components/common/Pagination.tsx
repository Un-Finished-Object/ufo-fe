type PaginationProps = {
  currentPage: number;
  nextPage: number;
  onPageChange: (page: number) => void;
  className?: string;
};

function getPageNumbers(currentPage: number, nextPage: number) {
  if (nextPage <= 0) {
    const visibleCount = Math.min(currentPage, 3);
    const startPage = Math.max(1, currentPage - visibleCount + 1);

    return Array.from({ length: currentPage - startPage + 1 }, (_, index) => startPage + index);
  }

  const lastPage = currentPage + Math.max(nextPage, 0);
  const visibleCount = Math.min(lastPage, 5);
  const initialStartPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(lastPage, initialStartPage + visibleCount - 1);
  const startPage = Math.max(1, endPage - visibleCount + 1);

  return Array.from({ length: endPage - startPage + 1 }, (_, index) => startPage + index);
}

export default function Pagination({
  currentPage,
  nextPage,
  onPageChange,
  className = "py-6",
}: PaginationProps) {
  const pages = getPageNumbers(currentPage, nextPage);

  if (pages.length <= 1) return null;

  return (
    <nav className={`flex items-center justify-center gap-1 ${className}`} aria-label="페이지 탐색">
      {pages.map((page) => {
        const isCurrentPage = currentPage === page;

        return (
          <button
            key={page}
            type="button"
            onClick={isCurrentPage ? undefined : () => onPageChange(page)}
            disabled={isCurrentPage}
            className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ${
              isCurrentPage
                ? "bg-ufo-brand text-white"
                : "text-ufo-text-secondary hover:bg-ufo-brand-pale"
            }`}
            aria-current={isCurrentPage ? "page" : undefined}
            aria-label={isCurrentPage ? `현재 페이지 ${page}` : `${page}페이지로 이동`}
          >
            {page}
          </button>
        );
      })}
    </nav>
  );
}
