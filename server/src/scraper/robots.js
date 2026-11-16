import robotsParser from 'robots-parser';

const cache = new Map();

export async function isAllowed(pageUrl, userAgent = 'OutreachTracker-Bot/1.0 (+https://outreachtracker.com/bot; bot@outreachtracker.com)') {
  try {
    const origin = new URL(pageUrl).origin;
    if (!cache.has(origin)) {
      const robotsUrl = `${origin}/robots.txt`;
      let parser = null;
      try {
        const res = await fetch(robotsUrl, {
          headers: { 'User-Agent': userAgent },
          signal: AbortSignal.timeout(8000),
        });
        if (res.status >= 500) {
          parser = 'deny';
        } else if (res.ok) {
          parser = robotsParser(robotsUrl, await res.text());
        }
      } catch {
        parser = null;
      }
      cache.set(origin, parser);
    }

    const parser = cache.get(origin);
    if (parser === 'deny') return false;
    if (!parser) return true;
    return parser.isAllowed(pageUrl, userAgent) !== false;
  } catch {
    return true;
  }
}
