export const normalizeDomain = (input) => {
  if (!input) return '';
  const value = String(input).trim().toLowerCase();
  try {
    const url = new URL(value.includes('://') ? value : `https://${value}`);
    const host = url.hostname;
    return host.startsWith('www.') ? host.slice(4) : host;
  } catch {
    return value.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  }
};

