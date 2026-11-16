import dns from 'node:dns/promises';
import ipaddr from 'ipaddr.js';

export async function assertSafeUrl(input) {
  let urlStr = String(input || '').trim();
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
    urlStr = `https://${urlStr}`;
  }

  const url = new URL(urlStr);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only http and https URLs are allowed');
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new Error('URL points to a private or reserved address');
  }

  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const { address } of addresses) {
      const parsed = ipaddr.parse(address);
      if (parsed.range() !== 'unicast') {
        throw new Error('URL points to a private or reserved address');
      }
    }
  } catch (err) {
    if (err.message.includes('private or reserved')) throw err;
  }

  return url;
}
