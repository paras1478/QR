import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ size = 24, className = '' }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={`animate-spin text-brand-500 ${className}`} />;
}

export function FullPageSpinner() {
  return (
    <div className="flex h-64 w-full items-center justify-center">
      <LoadingSpinner size={32} />
    </div>
  );
}
