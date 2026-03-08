import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Copy, ExternalLink } from 'lucide-react';
import { generateCodeVerifier, generateCodeChallenge } from '@/utils/pkce';
import { getAuthorizeUrl } from '@/services/api/oauth';
import { useAuthStore } from '@/stores/authStore';
import { getAuth } from '@/utils/storage';
import { open } from '@tauri-apps/plugin-shell';
import { getVersion } from '@tauri-apps/api/app';

function extractCodeFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const code = parsed.searchParams.get('code');
    console.log('[Login] extractCodeFromUrl:', { url, code: code ? `${code.slice(0, 8)}...` : null });
    return code;
  } catch (e) {
    console.error('[Login] extractCodeFromUrl failed to parse URL:', url, e);
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
      console.log('[Login] handleLogin called with code:', code.slice(0, 8) + '...');
      try {
        await login(code);
        console.log('[Login] login succeeded, navigating to /');
        navigate('/');
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err === 'string'
              ? err
              : JSON.stringify(err);
        console.error('[Login] login failed:', err);
        console.error('[Login] error type:', typeof err, 'instanceof Error:', err instanceof Error);
        setError(message || 'Login failed (unknown error)');
      }
    },
    [login, navigate]
  );

  useEffect(() => {
    const auth = getAuth();
    console.log('[Login] checking existing auth:', auth ? { expiresAt: auth.expiresAt, now: Date.now(), valid: auth.expiresAt > Date.now() } : 'none');
    if (auth && auth.expiresAt > Date.now()) {
      console.log('[Login] valid auth found, navigating to /');
      navigate('/');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    console.log('[Login] URL search params:', window.location.search, 'code:', code ? `${code.slice(0, 8)}...` : 'null');

    if (code) {
      handleLogin(code);
    }
  }, [navigate, handleLogin]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log('[Login] deep-link event received, detail:', detail, 'type:', typeof detail);
      const url = detail as string;
      const code = extractCodeFromUrl(url);
      if (code) {
        console.log('[Login] deep-link extracted code, calling handleLogin');
        handleLogin(code);
      } else {
        console.warn('[Login] deep-link received but no code extracted from URL:', url);
      }
    };

    console.log('[Login] registering deep-link event listener');
    window.addEventListener('deep-link', handler);
    return () => {
      console.log('[Login] removing deep-link event listener');
      window.removeEventListener('deep-link', handler);
    };
  }, [handleLogin]);

  const handleAuthorize = async () => {
    try {
      console.log('[Login] handleAuthorize: generating PKCE parameters...');
      const verifier = await generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      console.log('[Login] PKCE generated, verifier length:', verifier.length, 'challenge length:', challenge.length);

      localStorage.setItem('oauth_code_verifier', verifier);
      setCodeVerifier(verifier);
      console.log('[Login] code_verifier stored in localStorage and zustand');

      const url = getAuthorizeUrl(challenge);
      setAuthUrl(url);
      console.log('[Login] authorize URL:', url);

      try {
        await open(url);
        console.log('[Login] browser opened successfully');
      } catch (e) {
        console.error('[Login] failed to open browser:', e);
      }
    } catch (err) {
      console.error('[Login] handleAuthorize error:', err);
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
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors flex items-center justify-center gap-2"
        >
          <LogIn className="w-5 h-5" />
          Login with Pixiv
        </button>

        {authUrl && (
          <div className="mt-4 p-4 bg-gray-700 rounded-lg">
            <p className="text-gray-300 text-sm mb-2 flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4" />
              If browser didn't open, copy URL:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={authUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-gray-900 text-gray-300 text-xs rounded border border-gray-600"
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
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
