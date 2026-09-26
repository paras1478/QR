import { FileItem } from '../types';
import { FileCard } from './FileCard';

interface FileGridProps {
  files: FileItem[];
  onQr: (file: FileItem) => void;
  onShare: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

export function FileGrid({ files, onQr, onShare, onDelete }: FileGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {files.map((file) => (
        <FileCard key={file.id} file={file} onQr={onQr} onShare={onShare} onDelete={onDelete} />
      ))}
    </div>
  );
}
