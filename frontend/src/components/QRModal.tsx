import { useState } from 'react';
import { X, Copy, Download, Share as ShareIcon, Pencil, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileItem } from '../types';
import { setDisplayName as setDisplayNameRequest } from '../services/file.service';
import { apiErrorMessage } from '../services/api';

interface QRModalProps {
  open: boolean;
  onClose: () => void;
  file: FileItem;
  qrCode: string;
  shareUrl: string;
  onUpdated?: (file: FileItem) => void;
}

export function QRModal({ open, onClose, file, qrCode, shareUrl, onUpdated }: QRModalProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(file.displayName ?? '');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const downloadQr = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `${file.originalName.replace(/\.[^.]+$/, '')}-qr.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: file.displayName || file.originalName, url: shareUrl });
      } catch {
        // user cancelled share sheet
      }
    } else {
      await copyLink();
    }
  };

  const startEditing = () => {
    setDraft(file.displayName ?? '');
    setEditing(true);
  };

  const saveDisplayName = async () => {
    setSaving(true);
    try {
      const trimmed = draft.trim();
      const updated = await setDisplayNameRequest(file.id, trimmed || null);
      onUpdated?.(updated);
      setEditing(false);
      toast.success('Display name updated');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update display name'));
    } finally {
      setSaving(false);
    }
  };

  const displayText = file.displayName?.trim() || shareUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Share File</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 flex justify-center rounded-xl bg-white p-4">
          <img src={qrCode} alt="QR code" className="h-48 w-48" />
        </div>

        {editing ? (
          <div className="mt-4">
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
              Enter display name
            </label>
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="e.g. My Important Documents"
                maxLength={120}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                onClick={saveDisplayName}
                disabled={saving}
                className="flex items-center justify-center rounded-lg bg-brand-600 px-3 text-white hover:bg-brand-700 disabled:opacity-60"
                aria-label="Save display name"
              >
                <Check size={16} />
              </button>
            </div>
            <p className="mt-1 text-xs text-gray-400">Leave blank to show the raw share link instead.</p>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-gray-800">
            <p
              className={`flex-1 text-center text-xs text-gray-600 dark:text-gray-300 ${
                file.displayName ? '' : 'break-all'
              }`}
            >
              {displayText}
            </p>
            <button
              onClick={startEditing}
              className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              aria-label="Edit display name"
              title="Edit display name"
            >
              <Pencil size={14} />
            </button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            onClick={copyLink}
            className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Copy size={16} /> Copy Link
          </button>
          <button
            onClick={downloadQr}
            className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Download size={16} /> Download QR
          </button>
          <button
            onClick={share}
            className="flex flex-col items-center gap-1 rounded-lg border border-gray-200 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <ShareIcon size={16} /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
