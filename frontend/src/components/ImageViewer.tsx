import { useRef, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize, Minimize, Download } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt: string;
  onDownload: () => void;
}

export function ImageViewer({ src, alt, onDownload }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      await document.exitFullscreen();
      setFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className={`flex flex-col gap-3 ${fullscreen ? 'h-screen bg-black p-4' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-1">
          <button onClick={() => setScale((s) => Math.max(0.25, s - 0.25))} className="toolbar-btn" aria-label="Zoom out">
            <ZoomOut size={16} />
          </button>
          <span className="min-w-[45px] text-center text-xs text-gray-600 dark:text-gray-300">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(4, s + 0.25))} className="toolbar-btn" aria-label="Zoom in">
            <ZoomIn size={16} />
          </button>
          <button onClick={toggleFullscreen} className="toolbar-btn" aria-label="Toggle fullscreen">
            {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
        <button
          onClick={onDownload}
          className="flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
        >
          <Download size={14} /> Download
        </button>
      </div>

      <div className="flex max-h-[75vh] items-center justify-center overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
        <img
          src={src}
          alt={alt}
          style={{ transform: `scale(${scale})`, transition: 'transform 0.15s ease' }}
          className="max-w-full object-contain"
        />
      </div>
    </div>
  );
}
