import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Info, LogIn, Search, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { getVersion } from '@tauri-apps/api/app';
import { proxyImageUrl } from '@/utils/image';
import { getSettings, saveSettings, clearSearchHistory, getSearchHistory } from '@/utils/storage';

export function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [version, setVersion] = useState('');
  const [searchHistoryEnabled, setSearchHistoryEnabled] = useState(getSettings().searchHistoryEnabled);
  const [historyCount, setHistoryCount] = useState(getSearchHistory().length);

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
        <h2 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
          <Search className="w-5 h-5" />
          Search
        </h2>
        <div className="flex items-center justify-between py-2">
          <span className="text-gray-300">Search History</span>
          <button
            onClick={() => {
              const next = !searchHistoryEnabled;
              setSearchHistoryEnabled(next);
              saveSettings({ searchHistoryEnabled: next });
              if (!next) {
                clearSearchHistory();
                setHistoryCount(0);
              }
            }}
            className={`relative w-11 h-6 rounded-full transition-colors ${searchHistoryEnabled ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${searchHistoryEnabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>
        {searchHistoryEnabled && historyCount > 0 && (
          <button
            onClick={() => {
              clearSearchHistory();
              setHistoryCount(0);
            }}
            className="mt-2 flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear search history ({historyCount})
          </button>
        )}
      </div>

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
