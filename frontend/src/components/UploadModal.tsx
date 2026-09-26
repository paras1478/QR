import { useRef, useState } from 'react';
import { X, UploadCloud, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadFile } from '../services/file.service';
import { apiErrorMessage } from '../services/api';
import { FileWithShare } from '../types';

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onUploaded: (result: FileWithShare) => void;
}

type Status = 'idle' | 'uploading' | 'success' | 'error';

const ACCEPTED = '.pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt';

export function UploadModal({ open, onClose, onUploaded }: UploadModalProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const reset = () => {
    setStatus('idle');
    setProgress(0);
    setFileName('');
    setErrorMsg('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const doUpload = async (file: File) => {
    setStatus('uploading');
    setFileName(file.name);
    setProgress(0);
    try {
      const result = await uploadFile(file, setProgress);
      setStatus('success');
      onUploaded(result);
      toast.success('Upload successful!');
    } catch (err) {
      setStatus('error');
      setErrorMsg(apiErrorMessage(err, 'Upload failed. Please try again.'));
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files[0]) doUpload(files[0]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Upload File</h3>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        {status === 'idle' && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFileSelect(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={`mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
              dragOver ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20' : 'border-gray-300 dark:border-gray-700'
            }`}
          >
            <UploadCloud size={32} className="mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Click to upload or drag and drop</p>
            <p className="mt-1 text-xs text-gray-400">PDF, JPG, PNG, WEBP, DOC, DOCX, TXT</p>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
        )}

        {status === 'uploading' && (
          <div className="mt-6">
            <p className="mb-2 truncate text-sm text-gray-700 dark:text-gray-200">Uploading {fileName}…</p>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-right text-xs text-gray-500">{progress}%</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mt-6 flex flex-col items-center py-4 text-center">
            <CheckCircle2 size={40} className="mb-3 text-green-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Upload successful!</p>
            <p className="mt-1 truncate text-xs text-gray-500">{fileName}</p>
            <button
              onClick={handleClose}
              className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Done
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-6 flex flex-col items-center py-4 text-center">
            <XCircle size={40} className="mb-3 text-red-500" />
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Upload failed</p>
            <p className="mt-1 text-xs text-red-500">{errorMsg}</p>
            <button
              onClick={reset}
              className="mt-5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
