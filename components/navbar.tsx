'use client';

import { useRouter } from 'next/navigation';

export default function Navbar({ initials }: { initials: string }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <nav className="bg-blue-800 text-white shadow-lg no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="CRC Logo" className="h-10 w-auto rounded" />
            <div className="text-2xl font-bold tracking-tight">CRC</div>
            <div className="hidden sm:block text-sm opacity-90">
              California Raptor Center &mdash; Active Case List
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm bg-blue-700 px-3 py-1 rounded-full">
              {initials}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
