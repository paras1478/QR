import { Link, useNavigate } from 'react-router-dom';
import { FileStack, LogOut, Moon, Sun, User as UserIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out');
      navigate('/login');
    } catch {
      toast.error('Failed to log out');
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
          <FileStack className="text-brand-600" size={22} />
          <span>FileShare</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              <div className="hidden items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 sm:flex">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-5 w-5 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <UserIcon size={16} />
                )}
                {user.name}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
