import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">404</h1>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Page not found</p>
      <Link to="/" className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
        Go home
      </Link>
    </div>
  );
}
