/**
 * Convert Pixiv CDN image URLs to go through the Rust proxy protocol,
 * which adds the correct Referer header that i.pximg.net requires.
 *
 * Windows WebView2 doesn't support custom URI schemes directly —
 * Tauri maps them to http://<scheme>.localhost/ instead.
 */
const PXIMG_BASE = navigator.userAgent.includes('Windows')
  ? 'http://pximg.localhost'
  : 'pximg://localhost';

export function proxyImageUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('https://i.pximg.net/')) {
    return url.replace('https://i.pximg.net', PXIMG_BASE);
  }
  return url;
}
