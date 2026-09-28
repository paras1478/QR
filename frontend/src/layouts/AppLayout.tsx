import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { FloatingBackground } from '../components/FloatingBackground';

export function AppLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <FloatingBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
