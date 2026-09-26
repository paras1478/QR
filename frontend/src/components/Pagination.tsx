import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
      >
        <ChevronLeft size={16} /> Prev
      </button>
      <span className="text-sm text-gray-500 dark:text-gray-400">
        Page {page} of {totalPages}
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-200"
      >
        Next <ChevronRight size={16} />
      </button>
    </div>
  );
}
