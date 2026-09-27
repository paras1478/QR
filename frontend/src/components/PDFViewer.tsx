import { useEffect, useRef, useState } from 'react';
import { Document, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import toast from 'react-hot-toast';
import { ExternalLink, Download } from 'lucide-react';
import { PDFToolbar } from './PDFToolbar';
import { PDFPage } from './PDFPage';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorState } from './ErrorState';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

// Mobile Chrome (and several other mobile browsers) can fail to render a PDF
// inline reliably via react-pdf/pdf.js — on-device memory limits, no
// SharedArrayBuffer, etc. Rather than silently show a broken/blank viewer
// there, fall back to explicit "Open" / "Download" actions.
const SUPPORTS_INLINE_PDF_PREVIEW = !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

interface PDFViewerProps {
  previewUrl: string;
  pageCount: number;
  onDownloadPage: (pageNumber: number) => void;
  onDownloadFull: () => void;
}

export function PDFViewer({ previewUrl, pageCount, onDownloadPage, onDownloadFull }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(pageCount);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [fetchState, setFetchState] = useState<'loading' | 'ready' | 'error'>('loading');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!SUPPORTS_INLINE_PDF_PREVIEW) return;

    let cancelled = false;
    let objectUrl: string | null = null;
    setFetchState('loading');
    setLoadError(false);

    (async () => {
      try {
        const res = await fetch(previewUrl, { credentials: 'omit' });
        if (!res.ok) throw new Error(`Preview request failed with status ${res.status}`);

        const contentType = res.headers.get('Content-Type') || '';
        if (!contentType.includes('application/pdf')) {
          throw new Error(`Unexpected response Content-Type: ${contentType}`);
        }

        const blob = await res.blob();
        if (cancelled) return;

        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setFetchState('ready');
      } catch (err) {
        if (cancelled) return;
        // Always log this (not just in DEV): it's the only way to tell apart
        // a network/CORS failure, a non-2xx status, or a wrong Content-Type
        // from the browser console in production, without exposing anything
        // to the rendered UI.
        console.error('PDF preview fetch failed:', err);
        setFetchState('error');
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const handleFsChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const goToPage = (page: number) => {
    const clamped = Math.min(Math.max(1, page), numPages);
    setCurrentPage(clamped);
    const el = document.getElementById(`pdf-page-${clamped}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const fitWidth = () => {
    if (!containerRef.current) return;
    setScale(Math.min(1.5, Math.max(0.5, containerRef.current.clientWidth / 650)));
  };

  useEffect(() => {
    fitWidth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!SUPPORTS_INLINE_PDF_PREVIEW) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white p-16 text-center dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Inline preview isn&rsquo;t supported on this device. Open or download the PDF instead.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <ExternalLink size={16} /> Open PDF
          </button>
          <button
            onClick={onDownloadFull}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Download size={16} /> Download PDF
          </button>
        </div>
      </div>
    );
  }

  if (fetchState === 'error' || loadError) {
    return <ErrorState message="Could not load PDF preview." onRetry={onDownloadFull} />;
  }

  if (fetchState === 'loading' || !blobUrl) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <LoadingSpinner size={28} />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex flex-col gap-4 ${fullscreen ? 'h-screen bg-gray-100 p-4 dark:bg-gray-950' : ''}`}>
      <PDFToolbar
        page={currentPage}
        pageCount={numPages}
        scale={scale}
        fullscreen={fullscreen}
        onPrev={() => goToPage(currentPage - 1)}
        onNext={() => goToPage(currentPage + 1)}
        onZoomIn={() => setScale((s) => Math.min(3, s + 0.2))}
        onZoomOut={() => setScale((s) => Math.max(0.4, s - 0.2))}
        onFitWidth={fitWidth}
        onToggleFullscreen={toggleFullscreen}
        onDownloadPage={() => onDownloadPage(currentPage)}
        onDownloadFull={onDownloadFull}
      />

      <div className={`overflow-y-auto ${fullscreen ? 'flex-1' : 'max-h-[75vh]'}`}>
        <Document
          file={blobUrl}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          onLoadError={(err) => {
            console.error('PDF.js failed to parse the fetched PDF:', err);
            setLoadError(true);
          }}
          loading={
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner size={28} />
            </div>
          }
        >
          <div className="flex flex-col items-center gap-6 py-4">
            {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => (
              <div id={`pdf-page-${pageNumber}`} key={pageNumber}>
                <PDFPage
                  pageNumber={pageNumber}
                  scale={scale}
                  onDownload={(p) => {
                    onDownloadPage(p);
                    toast.success(`Downloading page ${p}…`);
                  }}
                />
              </div>
            ))}
          </div>
        </Document>
      </div>
    </div>
  );
}
