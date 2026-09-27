import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileStack } from 'lucide-react';
import toast from 'react-hot-toast';
import { forgotPasswordRequest } from '../services/auth.service';
import { apiErrorMessage } from '../services/api';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPasswordRequest(email);
      setSent(true);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center">
      <div className="mb-6 flex flex-col items-center">
        <FileStack className="mb-2 text-brand-600" size={32} />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Forgot password?</h1>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Enter your email address and we&rsquo;ll send you a password reset link.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {sent ? (
          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            If an account exists for <span className="font-medium">{email}</span>, a password reset link has been
            sent.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-5">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
