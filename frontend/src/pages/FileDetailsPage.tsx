import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Copy, Download, QrCode as QrIcon, Trash2, Pencil, Check } from 'lucide-react';
import {
  getFile,
  deleteFile,
  publicDownloadUrl,
  publicPreviewUrl,
  publicPageDownloadUrl,
  getPublicFile,
  setDisplayName as setDisplayNameRequest,
} from '../services/file.service';
import { apiErrorMessage } from '../services/api';
import { FileWithShare, PublicFileMeta } from '../types';
import { FullPageSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ShareModal } from '../components/ShareModal';
import { PDFViewer } from '../components/PDFViewer';
import { ImageViewer } from '../components/ImageViewer';
import { formatDate, formatFileSize, fileTypeLabel, isImage, isPdf } from '../utils/format';

export function FileDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<FileWithShare | null>(null);
  const [meta, setMeta] = useState<PublicFileMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const result = await getFile(id);
      setData(result);
      if (result.file.isPublic) {
        try {
          const publicMeta = await getPublicFile(result.file.shareId);
          setMeta(publicMeta);
        } catch {
          setMeta(null);
        }
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load file'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteFile(id);
      toast.success('File deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to delete file'));
      setDeleting(false);
    }
  };

  const copyLink = async () => {
    if (!data) return;
    await navigator.clipboard.writeText(data.shareUrl);
    toast.success('Link copied to clipboard');
  };

  const downloadQr = () => {
    if (!data) return;
    const link = document.createElement('a');
    link.href = data.qrCode;
    link.download = `${data.file.originalName.replace(/\.[^.]+$/, '')}-qr.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const startEditingName = () => {
    setNameDraft(data?.file.displayName ?? '');
    setEditingName(true);
  };

  const saveDisplayName = async () => {
    if (!id) return;
    setSavingName(true);
    try {
      const trimmed = nameDraft.trim();
      await setDisplayNameRequest(id, trimmed || null);
      setEditingName(false);
      toast.success('Display name updated');
      load();
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update display name'));
    } finally {
      setSavingName(false);
    }
  };

  if (loading) return <FullPageSpinner />;
  if (error || !data) return <ErrorState message={error || 'File not found'} onRetry={load} />;

  const { file, qrCode, shareUrl } = data;

  return (
    <div>
      <button
        onClick={() => navigate('/dashboard')}
        className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h1 className="break-words text-lg font-semibold text-gray-900 dark:text-gray-100">{file.originalName}</h1>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Type</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-200">{fileTypeLabel(file.mimeType)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Size</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-200">{formatFileSize(file.size)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Uploaded</dt>
                <dd className="font-medium text-gray-800 dark:text-gray-200">{formatDate(file.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500 dark:text-gray-400">Sharing</dt>
                <dd className={`font-medium ${file.isPublic ? 'text-green-600' : 'text-gray-500'}`}>
                  {file.isPublic ? 'Enabled' : 'Disabled'}
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex justify-center rounded-xl bg-white p-3">
              <img src={qrCode} alt="QR code" className="h-40 w-40" />
            </div>

            {editingName ? (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Enter display name
                </label>
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="e.g. My Important Documents"
                    maxLength={120}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <button
                    onClick={saveDisplayName}
                    disabled={savingName}
                    className="flex items-center justify-center rounded-lg bg-brand-600 px-3 text-white hover:bg-brand-700 disabled:opacity-60"
                    aria-label="Save display name"
                  >
                    <Check size={16} />
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-400">Leave blank to show the raw share link instead.</p>
              </div>
            ) : (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800">
                <p
                  className={`flex-1 text-center text-xs text-gray-600 dark:text-gray-300 ${
                    file.displayName ? '' : 'break-all'
                  }`}
                >
                  {file.displayName?.trim() || shareUrl}
                </p>
                <button
                  onClick={startEditingName}
                  className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Edit display name"
                  title="Edit display name"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                onClick={copyLink}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <Copy size={14} /> Copy Link
              </button>
              <button
                onClick={downloadQr}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <QrIcon size={14} /> Download QR
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                Share Settings
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                <Trash2 size={14} /> Delete File
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {isPdf(file.mimeType) && meta && meta.pageCount && (
            <PDFViewer
              previewUrl={publicPreviewUrl(file.shareId)}
              pageCount={meta.pageCount}
              onDownloadPage={(p) => window.open(publicPageDownloadUrl(file.shareId, p), '_blank')}
              onDownloadFull={() => window.open(publicDownloadUrl(file.shareId), '_blank')}
            />
          )}

          {isImage(file.mimeType) && (
            <ImageViewer
              src={publicDownloadUrl(file.shareId)}
              alt={file.originalName}
              onDownload={() => window.open(publicDownloadUrl(file.shareId), '_blank')}
            />
          )}

          {!isPdf(file.mimeType) && !isImage(file.mimeType) && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-16 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">Preview unavailable</p>
              <a
                href={publicDownloadUrl(file.shareId)}
                className="mt-4 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                <Download size={16} /> Download File
              </a>
            </div>
          )}

          {isPdf(file.mimeType) && !meta && (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-16 text-center dark:border-gray-800 dark:bg-gray-900">
              <p className="text-sm text-gray-500 dark:text-gray-400">Enable sharing to preview this PDF.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this file?"
        description="This will permanently delete the file and disable its share link."
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      {shareOpen && (
        <ShareModal
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          file={file}
          shareUrl={shareUrl}
          onUpdated={() => {
            load();
          }}
        />
      )}
    </div>
  );
}
