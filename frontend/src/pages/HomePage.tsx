import { Link } from 'react-router-dom';
import { QrCode, FileText, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 sm:text-4xl">
        Share files instantly with <span className="text-brand-600">QR codes</span>
      </h1>
      <p className="mt-4 max-w-xl text-gray-500 dark:text-gray-400">
        Upload a document, get a unique link and QR code, and let anyone view or download it — no app, no login
        required.
      </p>

      <Link
        to={user ? '/dashboard' : '/register'}
        className="mt-8 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
      >
        {user ? 'Go to Dashboard' : 'Get Started for Free'}
      </Link>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-left dark:border-gray-800 dark:bg-gray-900">
          <QrCode className="mb-3 text-brand-600" size={24} />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Instant QR Codes</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Every upload gets a scannable QR code automatically.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-left dark:border-gray-800 dark:bg-gray-900">
          <FileText className="mb-3 text-brand-600" size={24} />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">PDF Page Downloads</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Recipients can download individual pages, not just the whole file.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-left dark:border-gray-800 dark:bg-gray-900">
          <ShieldCheck className="mb-3 text-brand-600" size={24} />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Secure by Default</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Only you control who can access and when to revoke sharing.</p>
        </div>
      </div>
    </div>
  );
}
