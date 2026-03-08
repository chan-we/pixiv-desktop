import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useProxyStore } from '@/stores/proxyStore';
import { Globe, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ProxySettingsProps {
  compact?: boolean;
}

export function ProxySettings({ compact }: ProxySettingsProps) {
  const { enabled, url, updateProxy } = useProxyStore();
  const [localUrl, setLocalUrl] = useState(url);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null);
  const [testError, setTestError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleToggle = async () => {
    setSaving(true);
    setTestResult(null);
    await updateProxy(!enabled, localUrl);
    setSaving(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    await updateProxy(enabled, localUrl);
    setSaving(false);
  };

  const handleTest = async () => {
    const testUrl = localUrl.trim();
    if (!testUrl) return;

    setTesting(true);
    setTestResult(null);
    setTestError('');

    try {
      await invoke<string>('test_proxy', { url: testUrl });
      setTestResult('ok');
    } catch (e) {
      setTestResult('fail');
      setTestError(typeof e === 'string' ? e : String(e));
    } finally {
      setTesting(false);
    }
  };

  const urlChanged = localUrl !== url;

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Proxy
          </span>
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              enabled ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                enabled ? 'translate-x-4' : ''
              }`}
            />
          </button>
        </div>
        {enabled && (
          <div className="flex gap-2">
            <input
              type="text"
              value={localUrl}
              onChange={(e) => { setLocalUrl(e.target.value); setTestResult(null); }}
              onBlur={() => { if (urlChanged) handleSave(); }}
              placeholder="http://127.0.0.1:7890"
              className="flex-1 px-2.5 py-1.5 bg-gray-700 text-gray-200 text-xs rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleTest}
              disabled={testing || !localUrl.trim()}
              className="px-2.5 py-1.5 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white text-xs rounded flex items-center gap-1"
            >
              {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Test'}
            </button>
          </div>
        )}
        {testResult && (
          <div className={`flex items-center gap-1.5 text-xs ${testResult === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
            {testResult === 'ok' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {testResult === 'ok' ? 'Connected to Pixiv' : testError || 'Connection failed'}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white font-medium">HTTP / SOCKS5 Proxy</p>
          <p className="text-gray-400 text-sm mt-0.5">Route all requests through a proxy server</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            enabled ? 'bg-blue-600' : 'bg-gray-600'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {enabled && (
        <>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Proxy URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={localUrl}
                onChange={(e) => { setLocalUrl(e.target.value); setTestResult(null); }}
                placeholder="http://127.0.0.1:7890 or socks5://127.0.0.1:1080"
                className="flex-1 px-3 py-2 bg-gray-900 text-gray-200 text-sm rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              {urlChanged && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm rounded"
                >
                  Save
                </button>
              )}
              <button
                onClick={handleTest}
                disabled={testing || !localUrl.trim()}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 text-white text-sm rounded flex items-center gap-1.5"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Test'}
              </button>
            </div>
          </div>

          {testResult && (
            <div className={`flex items-center gap-2 text-sm ${testResult === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
              {testResult === 'ok' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {testResult === 'ok' ? 'Successfully connected to Pixiv via proxy' : testError || 'Connection failed'}
            </div>
          )}

          <p className="text-gray-500 text-xs">
            Supports HTTP, HTTPS, and SOCKS5 proxies. Examples: http://127.0.0.1:7890, socks5://127.0.0.1:1080
          </p>
        </>
      )}
    </div>
  );
}
