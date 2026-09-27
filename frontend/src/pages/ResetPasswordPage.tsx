import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FileStack } from 'lucide-react';
import toast from 'react-hot-toast';
import { resetPasswordRequest } from '../services/auth.service';
import { apiErrorMessage } from '../services/api';
import { PasswordInput } from '../components/PasswordInput';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('This password reset link is invalid or has expired.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordRequest(token, password);
      setDone(true);
      toast.success('Password reset successfully.');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'This password reset link is invalid or has expired.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center">
      <div className="mb-6 flex flex-col items-center">
        <FileStack className="mb-2 text-brand-600" size={32} />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Reset password</h1>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">Choose a new password for your account</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        {done ? (
          <div className="text-center">
            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">Password reset successfully.</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
            >
              Go to login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">New password</label>
              <PasswordInput
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-400">At least 8 characters</p>
            </div>
            <div className="mb-5">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirm new password
              </label>
              <PasswordInput
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? 'Resetting…' : 'Reset password'}
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
