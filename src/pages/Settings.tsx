import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { User, LogOut, Info, LogIn, Globe } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { pixivApi } from '@/services/api/pixiv';
import { getVersion } from '@tauri-apps/api/app';
import { proxyImageUrl } from '@/utils/image';
import { ProxySettings } from '@/components/ProxySettings';

export function Settings() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuthStore();
  const [version, setVersion] = useState('');

  const { data: userDetail } = useQuery({
    queryKey: ['userDetail', authUser?.id],
    queryFn: () => pixivApi.getUserDetail(authUser!.id),
    enabled: !!authUser?.id,
  });

  const user = userDetail?.user ?? authUser;

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Account
        </h2>
        {user ? (
          <div className="flex items-center gap-4">
            <img
              src={proxyImageUrl(user.profile_image_urls.medium)}
              alt={user.name}
              className="w-16 h-16 rounded-full"
            />
            <div>
              <p className="text-white font-medium">{user.name}</p>
              <p className="text-gray-400">@{user.account}</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400 mb-4">Not logged in</p>
            <button
              onClick={() => navigate('/login')}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-4 mb-4">
        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Network
        </h2>
        <ProxySettings />
      </div>

      {user && (
        <button
          onClick={handleLogout}
          className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      )}

      <div className="bg-gray-800 rounded-lg p-4 mt-4">
        <h2 className="text-lg font-medium text-white mb-2 flex items-center gap-2">
          <Info className="w-5 h-5" />
          About
        </h2>
        <p className="text-gray-400 text-sm">Pixiv Desktop {version && `v${version}`}</p>
      </div>
    </div>
  );
}
