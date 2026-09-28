import { useState } from 'react';
import { X, Copy, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileItem } from '../types';
import { regenerateShare, setSharing } from '../services/file.service';
import { apiErrorMessage } from '../services/api';

interface ShareModalProps {
  open: boolean;
  onClose: () => void;
  file: FileItem;
  shareUrl: string;
  onUpdated: (updated: { file: FileItem; shareUrl?: string; qrCode?: string }) => void;
}

export function ShareModal({ open, onClose, file, shareUrl, onUpdated }: ShareModalProps) {
  const [regenerating, setRegenerating] = useState(false);
  const [toggling, setToggling] = useState(false);

  if (!open) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const result = await regenerateShare(file.id);
      onUpdated(result);
      toast.success('Share link regenerated');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to regenerate link'));
    } finally {
      setRegenerating(false);
    }
  };

  const handleToggle = async () => {
    setToggling(true);
    try {
      const updated = await setSharing(file.id, !file.isPublic);
      onUpdated({ file: updated });
      toast.success(updated.isPublic ? 'Sharing enabled' : 'Sharing disabled');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Failed to update sharing'));
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Share Settings</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 dark:border-gray-700">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Public Sharing</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{file.isPublic ? 'Anyone with the link can view' : 'Link is disabled'}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={file.isPublic}
            aria-label="Public Sharing"
            onClick={handleToggle}
            disabled={toggling}
            className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors duration-200 disabled:opacity-60 ${
              file.isPublic ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <span
              className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200"
              style={{ transform: file.isPublic ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </button>
        </div>

        <p className="mt-4 break-all rounded-lg bg-gray-100 px-3 py-2 text-center text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
          {shareUrl}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={copyLink}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Copy size={14} /> Copy Link
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} /> New Link
          </button>
        </div>
      </div>
    </div>
  );
}
