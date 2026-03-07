import { createBrowserRouter, Navigate, Outlet, redirect } from 'react-router-dom';
import { getAuth } from '@/utils/storage';
import { Login } from '@/pages/Login';
import { Home } from '@/pages/Home';
import { Search } from '@/pages/Search';
import { ImageDetail } from '@/pages/ImageDetail';
import { Settings } from '@/pages/Settings';

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

function Layout() {
  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <a href="/" className="text-xl font-bold text-white">Pixiv</a>
          <div className="flex items-center gap-4">
            <a href="/search" className="text-gray-300 hover:text-white transition-colors">Search</a>
            <a href="/settings" className="text-gray-300 hover:text-white transition-colors">Settings</a>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
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
        element: <Search />,
      },
      {
        path: 'image/:id',
        element: <ImageDetail />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
]);

export default router;
