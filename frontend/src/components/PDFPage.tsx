import { useState, useRef, useEffect } from 'react';
import { Page } from 'react-pdf';
import { Download } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

interface PDFPageProps {
  pageNumber: number;
  scale: number;
  onDownload: (pageNumber: number) => void;
}

export function PDFPage({ pageNumber, scale, onDownload }: PDFPageProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {visible ? (
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            loading={
              <div className="flex h-64 w-48 items-center justify-center">
                <LoadingSpinner />
              </div>
            }
          />
        ) : (
          <div className="flex h-64 w-48 items-center justify-center text-xs text-gray-400">Page {pageNumber}</div>
        )}
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Page {pageNumber}</span>
        <button
          onClick={() => onDownload(pageNumber)}
          className="flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          <Download size={12} /> Download Page
        </button>
      </div>
    </div>
  );
}
