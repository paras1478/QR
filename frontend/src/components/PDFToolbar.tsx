import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Minimize, Download } from 'lucide-react';

interface PDFToolbarProps {
  page: number;
  pageCount: number;
  scale: number;
  fullscreen: boolean;
  onPrev: () => void;
  onNext: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitWidth: () => void;
  onToggleFullscreen: () => void;
  onDownloadPage: () => void;
  onDownloadFull: () => void;
}

export function PDFToolbar({
  page,
  pageCount,
  scale,
  fullscreen,
  onPrev,
  onNext,
  onZoomIn,
  onZoomOut,
  onFitWidth,
  onToggleFullscreen,
  onDownloadPage,
  onDownloadFull,
}: PDFToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-1">
        <button onClick={onPrev} disabled={page <= 1} className="toolbar-btn" aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        <span className="min-w-[70px] text-center text-xs font-medium text-gray-600 dark:text-gray-300">
          Page {page} / {pageCount}
        </span>
        <button onClick={onNext} disabled={page >= pageCount} className="toolbar-btn" aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={onZoomOut} className="toolbar-btn" aria-label="Zoom out">
          <ZoomOut size={16} />
        </button>
        <span className="min-w-[45px] text-center text-xs text-gray-600 dark:text-gray-300">{Math.round(scale * 100)}%</span>
        <button onClick={onZoomIn} className="toolbar-btn" aria-label="Zoom in">
          <ZoomIn size={16} />
        </button>
        <button onClick={onFitWidth} className="toolbar-btn text-xs" aria-label="Fit width">
          Fit
        </button>
        <button onClick={onToggleFullscreen} className="toolbar-btn" aria-label="Toggle fullscreen">
          {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onDownloadPage}
          className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <Download size={14} /> Page
        </button>
        <button
          onClick={onDownloadFull}
          className="flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
        >
          <Download size={14} /> Full PDF
        </button>
      </div>
    </div>
  );
}
