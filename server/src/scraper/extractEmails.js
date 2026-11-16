const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+(?:[.][a-z0-9-]+)*[.][a-z]{2,}/gi;
const IMAGE_ENDINGS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp', '.tiff'];
const ROLE_NAMES = [
  'info',
  'admin',
  'support',
  'sales',
  'noreply',
  'no-reply',
  'webmaster',
  'hello',
  'contact',
  'billing',
  'help',
  'team',
  'office',
];

export function extractEmails($, sourceUrl = '') {
  const found = new Set();

  $('a[href^=mailto]').each((_, el) => {
    const address = ($(el).attr('href') || '').slice(7).split('?')[0].trim().toLowerCase();
    if (address && address.includes('@') && address.includes('.')) found.add(address);
  });

  const text = $.text()
    .replaceAll('[at]', '@')
    .replaceAll('(at)', '@')
    .replaceAll('[dot]', '.')
    .replaceAll('(dot)', '.');

  for (const match of text.match(EMAIL) || []) {
    found.add(match.toLowerCase());
  }

  return [...found]
    .filter((email) => !IMAGE_ENDINGS.some((ending) => email.endsWith(ending)))
    .map((email) => {
      const username = email.split('@')[0] || '';
      return {
        email,
        isRole: ROLE_NAMES.includes(username),
        sourceUrl,
      };
    });
}
