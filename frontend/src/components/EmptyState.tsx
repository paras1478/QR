import { ReactNode } from 'react';
import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 text-gray-400 dark:text-gray-600">{icon ?? <FileQuestion size={40} />}</div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
