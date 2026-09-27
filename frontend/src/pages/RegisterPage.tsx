import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileStack } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { apiErrorMessage } from '../services/api';
import { GoogleButton } from '../components/GoogleButton';
import { PasswordInput } from '../components/PasswordInput';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not create account'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center">
      <div className="mb-6 flex flex-col items-center">
        <FileStack className="mb-2 text-brand-600" size={32} />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Create your account</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Start sharing files with QR codes</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
        <div className="mb-5">
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
          <PasswordInput required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="mt-1 text-xs text-gray-400">At least 8 characters</p>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? 'Creating account…' : 'Sign up'}
        </button>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
        </div>

        <GoogleButton label="Sign up with Google" />
      </form>

      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
