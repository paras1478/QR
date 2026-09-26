import { Link } from 'react-router-dom';
import { FileText, Image as ImageIcon, File as FileIcon, QrCode, Share2, Trash2 } from 'lucide-react';
import { FileItem } from '../types';
import { formatDate, formatFileSize, fileTypeLabel, isImage, isPdf } from '../utils/format';

interface FileCardProps {
  file: FileItem;
  onQr: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

function FileIconFor({ mimeType }: { mimeType: string }) {
  if (isPdf(mimeType)) return <FileText className="text-red-500" size={22} />;
  if (isImage(mimeType)) return <ImageIcon className="text-blue-500" size={22} />;
  return <FileIcon className="text-gray-500" size={22} />;
}

export function FileCard({ file, onQr, onShare, onDelete }: FileCardProps) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <Link to={`/files/${file.id}`} className="flex flex-1 flex-col">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
          <FileIconFor mimeType={file.mimeType} />
        </div>
        <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100" title={file.originalName}>
          {file.originalName}
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {fileTypeLabel(file.mimeType)} • {formatFileSize(file.size)}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">Uploaded: {formatDate(file.createdAt)}</p>
      </Link>

      <div className="mt-4 flex items-center gap-1 border-t border-gray-100 pt-3 dark:border-gray-800">
        <button
          onClick={() => onQr(file)}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          title="QR Code"
        >
          <QrCode size={14} /> QR
        </button>
        <button
          onClick={() => onShare(file)}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          title="Share"
        >
          <Share2 size={14} /> Share
        </button>
        <button
          onClick={() => onDelete(file)}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          title="Delete"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}
