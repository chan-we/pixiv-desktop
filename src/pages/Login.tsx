import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateCodeVerifier, generateCodeChallenge } from '@/utils/pkce';
import { getAuthorizeUrl } from '@/services/api/oauth';
import { useAuthStore } from '@/stores/authStore';
import { getAuth } from '@/utils/storage';
import { open } from '@tauri-apps/plugin-shell';
import { getVersion } from '@tauri-apps/api/app';

function extractCodeFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('code');
  } catch {
    return null;
  }
}

export function Login() {
  const navigate = useNavigate();
  const { login, setCodeVerifier } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const [version, setVersion] = useState('');

  useEffect(() => {
    getVersion().then(setVersion);
  }, []);

  const handleLogin = useCallback(
    async (code: string) => {
      try {
        await login(code);
        navigate('/');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Login failed');
      }
    },
    [login, navigate]
  );

  useEffect(() => {
    const auth = getAuth();
    if (auth && auth.expiresAt > Date.now()) {
      navigate('/');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      handleLogin(code);
    }
  }, [navigate, handleLogin]);

  // Listen for deep link URLs forwarded from the Rust single-instance callback via window.eval()
  useEffect(() => {
    const handler = (e: Event) => {
      const url = (e as CustomEvent).detail as string;
      const code = extractCodeFromUrl(url);
      if (code) {
        handleLogin(code);
      }
    };

    window.addEventListener('deep-link', handler);
    return () => window.removeEventListener('deep-link', handler);
  }, [handleLogin]);

  const handleAuthorize = async () => {
    try {
      const verifier = await generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);

      localStorage.setItem('oauth_code_verifier', verifier);
      setCodeVerifier(verifier);

      const url = getAuthorizeUrl(challenge);
      setAuthUrl(url);

      try {
        await open(url);
      } catch (e) {
        console.error('Failed to open browser:', e);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate URL');
    }
  };

  const copyToClipboard = () => {
    if (authUrl) {
      navigator.clipboard.writeText(authUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Pixiv Desktop</h1>
          <p className="text-gray-400">Login with your Pixiv account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleAuthorize}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
        >
          Login with Pixiv
        </button>

        {authUrl && (
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <p className="text-gray-300 text-sm mb-2">If browser didn't open, copy URL:</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={authUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-900 text-gray-300 text-xs rounded border border-gray-600"
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-gray-500 text-sm">
          You will be redirected to Pixiv for authentication.
        </p>
      </div>
      {version && (
        <p className="absolute bottom-4 text-gray-600 text-xs">v{version}</p>
      )}
    </div>
  );
}
