import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileStack, File as FileIcon } from 'lucide-react';
import { getPublicFile, publicDownloadUrl, publicPreviewUrl, publicPageDownloadUrl } from '../services/file.service';
import { apiErrorMessage } from '../services/api';
import { PublicFileMeta } from '../types';
import { FullPageSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { PDFViewer } from '../components/PDFViewer';
import { ImageViewer } from '../components/ImageViewer';
import { formatFileSize, fileTypeLabel, isImage, isPdf } from '../utils/format';

export function SharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [meta, setMeta] = useState<PublicFileMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    if (!shareId) return;
    setLoading(true);
    setError('');
    try {
      const result = await getPublicFile(shareId);
      setMeta(result);
    } catch (err) {
      setError(apiErrorMessage(err, 'This file is no longer available.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId]);

  if (loading) return <FullPageSpinner />;

  if (error || !meta || !shareId) {
    return (
      <div className="mx-auto max-w-md py-20">
        <ErrorState message={error || 'This file is no longer available.'} onRetry={load} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl py-6">
      <div className="mb-6 flex items-center gap-2 text-brand-600">
        <FileStack size={24} />
        <span className="text-lg font-semibold">FileShare</span>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <FileIcon className="text-gray-500" size={24} />
          </div>
          <div>
            <h1 className="break-all text-base font-semibold text-gray-900 dark:text-gray-100">
              {meta.displayName?.trim() || meta.originalName}
            </h1>
            {meta.displayName?.trim() && (
              <p className="break-all text-xs text-gray-400 dark:text-gray-500">{meta.originalName}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {fileTypeLabel(meta.mimeType)} • {formatFileSize(meta.size)}
            </p>
          </div>
        </div>

        <a
          href={publicDownloadUrl(shareId)}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 sm:w-auto sm:px-6"
        >
          <Download size={18} /> Download Full {isPdf(meta.mimeType) ? 'PDF' : 'File'}
        </a>
      </div>

      {isPdf(meta.mimeType) && meta.pageCount && (
        <PDFViewer
          previewUrl={publicPreviewUrl(shareId)}
          pageCount={meta.pageCount}
          onDownloadPage={(p) => window.open(publicPageDownloadUrl(shareId, p), '_blank')}
          onDownloadFull={() => window.open(publicDownloadUrl(shareId), '_blank')}
        />
      )}

      {isImage(meta.mimeType) && (
        <ImageViewer
          src={publicDownloadUrl(shareId)}
          alt={meta.originalName}
          onDownload={() => window.open(publicDownloadUrl(shareId), '_blank')}
        />
      )}

      {!isPdf(meta.mimeType) && !isImage(meta.mimeType) && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-16 text-center dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">Preview unavailable</p>
          <a
            href={publicDownloadUrl(shareId)}
            className="mt-4 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Download size={16} /> Download File
          </a>
        </div>
      )}
    </div>
  );
}
