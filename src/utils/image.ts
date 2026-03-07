/**
 * Convert Pixiv CDN image URLs to go through the Rust proxy protocol,
 * which adds the correct Referer header that i.pximg.net requires.
 */
export function proxyImageUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('https://i.pximg.net/')) {
    return url.replace('https://i.pximg.net', 'pximg://localhost');
  }
  return url;
}
