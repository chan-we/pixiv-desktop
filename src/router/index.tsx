import { createBrowserRouter, Navigate, Outlet, redirect } from 'react-router-dom';
import { Home as HomeIcon, Search, Settings, Download, UserCircle } from 'lucide-react';
import { getAuth } from '@/utils/storage';
import { Login } from '@/pages/Login';
import { Home } from '@/pages/Home';
import { Search as SearchPage } from '@/pages/Search';
import { ImageDetail } from '@/pages/ImageDetail';
import { Settings as SettingsPage } from '@/pages/Settings';
import { Profile } from '@/pages/Profile';
import { UserProfile } from '@/pages/UserProfile';
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
      title="Downloads"
      className={`relative transition-colors ${
        panelOpen ? 'text-white' : 'text-gray-300 hover:text-white'
      }`}
    >
      <Download className="w-4 h-4" />
      {activeCount > 0 && (
        <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center px-1 text-[10px] font-bold text-white bg-blue-500 rounded-full">
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
            <a href="/search" className="text-gray-300 hover:text-white transition-colors" title="Search">
              <Search className="w-4 h-4" />
            </a>
            <DownloadNavButton />
            <a href="/profile" className="text-gray-300 hover:text-white transition-colors" title="Profile">
              <UserCircle className="w-4 h-4" />
            </a>
            <a href="/settings" className="text-gray-300 hover:text-white transition-colors" title="Settings">
              <Settings className="w-4 h-4" />
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
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'user/:id',
        element: <UserProfile />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
]);

export default router;
