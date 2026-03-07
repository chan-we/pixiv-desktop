import { createBrowserRouter, Navigate, Outlet, redirect } from 'react-router-dom';
import { Home as HomeIcon, Search, Settings, Download } from 'lucide-react';
import { getAuth } from '@/utils/storage';
import { Login } from '@/pages/Login';
import { Home } from '@/pages/Home';
import { Search as SearchPage } from '@/pages/Search';
import { ImageDetail } from '@/pages/ImageDetail';
import { Settings as SettingsPage } from '@/pages/Settings';
import { DownloadPanel } from '@/components/download/DownloadPanel';
import { useDownloadStore } from '@/stores/downloadStore';

function checkAuth() {
  const auth = getAuth();
  if (!auth || auth.expiresAt < Date.now()) {
    return false;
  }
  return true;
}

function requireAuth() {
  if (!checkAuth()) {
    throw redirect('/login');
  }
  return null;
}

function DownloadNavButton() {
  const { tasks, panelOpen, togglePanel } = useDownloadStore();
  const activeCount = tasks.filter((t) => t.status === 'pending' || t.status === 'downloading').length;

  return (
    <button
      onClick={togglePanel}
      className={`flex items-center gap-1.5 transition-colors relative ${
        panelOpen ? 'text-white' : 'text-gray-300 hover:text-white'
      }`}
    >
      <Download className="w-4 h-4" />
      Downloads
      {activeCount > 0 && (
        <span className="absolute -top-1.5 -right-3 min-w-[16px] h-4 flex items-center justify-center px-1 text-[10px] font-bold text-white bg-blue-500 rounded-full">
          {activeCount}
        </span>
      )}
    </button>
  );
}

function Layout() {
  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <a href="/" className="flex items-center gap-2 text-xl font-bold text-white">
            <HomeIcon className="w-5 h-5" />
            Pixiv
          </a>
          <div className="flex items-center gap-4">
            <a href="/search" className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors">
              <Search className="w-4 h-4" />
              Search
            </a>
            <DownloadNavButton />
            <a href="/settings" className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors">
              <Settings className="w-4 h-4" />
              Settings
            </a>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
      <DownloadPanel />
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Layout />,
    loader: requireAuth,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />,
      },
      {
        path: 'home',
        element: <Home />,
      },
      {
        path: 'search',
        element: <SearchPage />,
      },
      {
        path: 'image/:id',
        element: <ImageDetail />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
]);

export default router;
