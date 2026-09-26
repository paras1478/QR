import { useEffect, useRef, useState } from 'react';
import { Document, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import toast from 'react-hot-toast';
import { PDFToolbar } from './PDFToolbar';
import { PDFPage } from './PDFPage';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorState } from './ErrorState';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface PDFViewerProps {
  fileUrl: string;
  pageCount: number;
  onDownloadPage: (pageNumber: number) => void;
  onDownloadFull: () => void;
}

export function PDFViewer({ fileUrl, pageCount, onDownloadPage, onDownloadFull }: PDFViewerProps) {
  const [numPages, setNumPages] = useState(pageCount);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  if (loadError) {
    return <ErrorState message="Could not load PDF preview." />;
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
          file={fileUrl}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          onLoadError={() => setLoadError(true)}
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
