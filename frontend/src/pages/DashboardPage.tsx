import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, FileStack } from 'lucide-react';
import toast from 'react-hot-toast';
import { SearchBar } from '../components/SearchBar';
import { FileGrid } from '../components/FileGrid';
import { FileCardSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pagination } from '../components/Pagination';
import { UploadModal } from '../components/UploadModal';
import { QRModal } from '../components/QRModal';
import { ShareModal } from '../components/ShareModal';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useDebounce } from '../hooks/useDebounce';
import { usePolling, POLLING_INTERVAL } from '../hooks/usePolling';
import { listFiles, searchFiles, deleteFile as deleteFileRequest, getFile } from '../services/file.service';
import { apiErrorMessage } from '../services/api';
import { FileItem } from '../types';

export function DashboardPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [qrTarget, setQrTarget] = useState<{ file: FileItem; qrCode: string; shareUrl: string } | null>(null);
  const [shareTarget, setShareTarget] = useState<{ file: FileItem; shareUrl: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FileItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Tracks whether we've completed at least one successful fetch for the
  // current query/page, so the background poll only shows the full skeleton
  // loader on the very first load, not on every 5s refresh.
  const hasLoadedRef = useRef(false);

  const fetchFiles = useCallback(async () => {
    const result = debouncedQuery ? await searchFiles(debouncedQuery, page, 20) : await listFiles(page, 20);
    setFiles(result.items);
    setTotalPages(result.totalPages);
  }, [debouncedQuery, page]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await fetchFiles();
      hasLoadedRef.current = true;
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load your files'));
    } finally {
      setLoading(false);
    }
  }, [fetchFiles]);

  useEffect(() => {
    hasLoadedRef.current = false;
    setPage(1);
  }, [debouncedQuery]);

  // Background refresh: keeps the file list (new uploads, sharing/QR
  // changes made elsewhere) up to date without manual refresh. Silent on
  // failure (no toast spam every 5s) and skipped entirely while the initial
  // load/skeleton for this query+page hasn't finished yet, to avoid
  // clobbering that in-flight request.
  const refreshFiles = useCallback(async () => {
    if (!hasLoadedRef.current) return;
    try {
      await fetchFiles();
    } catch {
      // Ignore transient background refresh errors; the visible file list
      // and any user-triggered load() already surface real failures.
    }
  }, [fetchFiles]);

  useEffect(() => {
    load();
  }, [load]);

  usePolling(refreshFiles, POLLING_INTERVAL);

  const handleQr = async (file: FileItem) => {
    try {
      const result = await getFile(file.id);
      setQrTarget({ file: result.file, qrCode: result.qrCode, shareUrl: result.shareUrl });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const handleShare = async (file: FileItem) => {
    try {
      const result = await getFile(file.id);
      setShareTarget({ file: result.file, shareUrl: result.shareUrl });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteFileRequest(deleteTarget.id);
      toast.success('File deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete file'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 sm:max-w-md">
          <SearchBar value={query} onChange={setQuery} />
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus size={18} /> Upload File
        </button>
      </div>

      <h2 className="mb-4 text-sm font-semibold text-gray-500 dark:text-gray-400">
        {debouncedQuery ? `Search results for "${debouncedQuery}"` : 'My Documents'}
      </h2>

      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <FileCardSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && error && <ErrorState message={error} onRetry={load} />}

      {!loading && !error && files.length === 0 && (
        <EmptyState
          icon={<FileStack size={40} />}
          title={debouncedQuery ? `No documents found for "${debouncedQuery}".` : "You haven't uploaded any files yet."}
          description={
            debouncedQuery ? undefined : 'Upload your first document and generate a QR code to share it.'
          }
          action={
            !debouncedQuery && (
              <button
                onClick={() => setUploadOpen(true)}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Upload File
              </button>
            )
          }
        />
      )}

      {!loading && !error && files.length > 0 && (
        <>
          <FileGrid files={files} onQr={handleQr} onShare={handleShare} onDelete={setDeleteTarget} />
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => {
          load();
        }}
      />

      {qrTarget && (
        <QRModal
          open={Boolean(qrTarget)}
          onClose={() => setQrTarget(null)}
          file={qrTarget.file}
          qrCode={qrTarget.qrCode}
          shareUrl={qrTarget.shareUrl}
          onUpdated={(updatedFile) => {
            setQrTarget((prev) => (prev ? { ...prev, file: updatedFile } : prev));
            load();
          }}
        />
      )}

      {shareTarget && (
        <ShareModal
          open={Boolean(shareTarget)}
          onClose={() => setShareTarget(null)}
          file={shareTarget.file}
          shareUrl={shareTarget.shareUrl}
          onUpdated={(updated) => {
            setShareTarget((prev) =>
              prev ? { file: updated.file, shareUrl: updated.shareUrl ?? prev.shareUrl } : prev
            );
            load();
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this file?"
        description={`"${deleteTarget?.originalName}" will be permanently deleted, and its share link will stop working.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
