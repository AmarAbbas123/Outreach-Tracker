import * as cheerio from 'cheerio';
import { extractEmails } from './extractEmails.js';

export function extractPageData(html, pageUrl) {
  const $ = cheerio.load(html);
  const urlObj = new URL(pageUrl);
  const origin = urlObj.origin;

  // 1. Meta / Head Details
  const title = (
    $('title').first().text() ||
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    ''
  ).trim();

  const description = (
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="twitter:description"]').attr('content') ||
    ''
  ).trim();

  const siteName = (
    $('meta[property="og:site_name"]').attr('content') ||
    title.split(/[-–|:]/)[0] ||
    urlObj.hostname
  ).trim();

  const language = ($('html').attr('lang') || 'en').slice(0, 5).toLowerCase();

  // 2. CMS Detection
  let cms = 'Unknown';
  const htmlLower = html.toLowerCase();
  if (htmlLower.includes('wp-content') || htmlLower.includes('wp-includes')) cms = 'WordPress';
  else if (htmlLower.includes('cdn.shopify.com')) cms = 'Shopify';
  else if (htmlLower.includes('static1.squarespace.com')) cms = 'Squarespace';
  else if (htmlLower.includes('wix.com') || htmlLower.includes('wixsite')) cms = 'Wix';
  else if (htmlLower.includes('ghost.org') || htmlLower.includes('ghost-')) cms = 'Ghost';
  else if (htmlLower.includes('hubspot')) cms = 'HubSpot';
  else if (htmlLower.includes('webflow')) cms = 'Webflow';

  // 3. Contact Emails & Phones
  const emails = extractEmails($, pageUrl);

  const phones = new Set();
  // tel: links
  $('a[href^="tel:"]').each((_, el) => {
    let p = ($(el).attr('href') || '').slice(4).trim();
    p = p.replace(/[^\d+().\-\s]/g, '').trim();
    const digits = p.replace(/\D/g, '');
    if (digits.length >= 7 && digits.length <= 16) {
      phones.add(p);
    }
  });

  // Regex phone scan across text and common contact containers
  const phoneRegex = /(?:(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}|\b\+?[1-9]\d{1,14}\b)/g;
  const candidateText = $('footer, header, [class*="contact"], [id*="contact"], [class*="about"], [id*="about"], body').text().replace(/\s+/g, ' ');
  const rawMatches = candidateText.match(phoneRegex) || [];
  for (const raw of rawMatches) {
    const cleaned = raw.trim();
    const digitsOnly = cleaned.replace(/\D/g, '');
    // Avoid false positives: years, zip codes, random short numbers
    if (
      digitsOnly.length >= 7 &&
      digitsOnly.length <= 15 &&
      !/^(19|20)\d{2}$/.test(cleaned) &&
      !/^\d{5}$/.test(cleaned)
    ) {
      if (cleaned.includes('-') || cleaned.includes('(') || cleaned.includes('.') || cleaned.startsWith('+') || digitsOnly.length >= 10) {
        phones.add(cleaned);
        if (phones.size >= 10) break;
      }
    }
  }

  // 4. Social Links
  const socials = {
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    youtube: '',
    tiktok: '',
    github: '',
    pinterest: '',
  };

  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    const lower = href.toLowerCase();

    if (!socials.linkedin && (lower.includes('linkedin.com/company/') || lower.includes('linkedin.com/in/') || lower.includes('linkedin.com/pub/'))) {
      socials.linkedin = href;
    } else if (!socials.twitter && (lower.includes('twitter.com/') || lower.includes('x.com/'))) {
      if (!lower.includes('/status/') && !lower.includes('/intent/') && !lower.includes('sharer') && !lower.includes('/share')) {
        socials.twitter = href;
      }
    } else if (!socials.facebook && (lower.includes('facebook.com/') || lower.includes('fb.com/'))) {
      if (!lower.includes('sharer') && !lower.includes('plugins') && !lower.includes('/share')) {
        socials.facebook = href;
      }
    } else if (!socials.instagram && lower.includes('instagram.com/')) {
      if (!lower.includes('/explore/') && !lower.includes('/accounts/')) {
        socials.instagram = href;
      }
    } else if (!socials.youtube && (lower.includes('youtube.com/channel/') || lower.includes('youtube.com/@') || lower.includes('youtube.com/user/') || lower.includes('youtube.com/c/'))) {
      socials.youtube = href;
    } else if (!socials.tiktok && lower.includes('tiktok.com/@')) {
      socials.tiktok = href;
    } else if (!socials.github && lower.includes('github.com/')) {
      if (!lower.includes('github.com/pricing') && !lower.includes('github.com/features')) {
        socials.github = href;
      }
    } else if (!socials.pinterest && lower.includes('pinterest.com/')) {
      if (!lower.includes('pin/create') && !lower.includes('pin.it')) {
        socials.pinterest = href;
      }
    }
  });

  // 5. Contact, Team & Guest Post Subpages
  let contactPageUrl = '';
  let guestPostPageUrl = '';
  const discoveredSubpages = new Set();

  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    const text = $(el).text().toLowerCase().trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

    let fullUrl = '';
    try {
      fullUrl = new URL(href, origin).href;
    } catch {
      return;
    }

    if (!fullUrl.startsWith(origin)) return; // Internal links only
    const lower = fullUrl.toLowerCase();

    // Contact page check
    if (
      text === 'contact' ||
      text === 'contact us' ||
      text === 'about us' ||
      text === 'team' ||
      lower.includes('/contact') ||
      lower.includes('/contact-us') ||
      lower.includes('/contactus') ||
      lower.includes('/about') ||
      lower.includes('/about-us') ||
      lower.includes('/aboutus') ||
      lower.includes('/get-in-touch') ||
      lower.includes('/team') ||
      lower.includes('/our-team') ||
      lower.includes('/people') ||
      lower.includes('/leadership') ||
      lower.includes('/impressum') ||
      lower.includes('/privacy') ||
      lower.includes('/terms')
    ) {
      if (!contactPageUrl && (lower.includes('/contact') || text.includes('contact'))) {
        contactPageUrl = fullUrl;
      }
      discoveredSubpages.add(fullUrl);
    }

    // Guest post page check
    if (
      text.includes('write for us') ||
      text.includes('contribute') ||
      text.includes('guest post') ||
      text.includes('submit article') ||
      lower.includes('/write-for-us') ||
      lower.includes('/contribute') ||
      lower.includes('/guest-post') ||
      lower.includes('/submit-guest-post') ||
      lower.includes('/submissions')
    ) {
      if (!guestPostPageUrl) guestPostPageUrl = fullUrl;
      discoveredSubpages.add(fullUrl);
    }
  });

  // 6. Authors & Latest Date
  const authors = new Set();
  $('[rel="author"], .author, .byline, [itemprop="author"], meta[name="author"]').each((_, el) => {
    const name = ($(el).attr('content') || $(el).text() || '').trim();
    if (name && name.length < 50 && !name.toLowerCase().includes('admin')) {
      authors.add(name);
    }
  });

  let latestDate = '';
  $('time, meta[property="article:published_time"], meta[property="og:updated_time"]').each((_, el) => {
    if (!latestDate) {
      const dt = $(el).attr('datetime') || $(el).attr('content') || $(el).text();
      if (dt && !isNaN(Date.parse(dt))) {
        latestDate = new Date(dt).toISOString().split('T')[0];
      }
    }
  });

  // 7. Auto-detect Tables
  const tables = [];
  $('table').each((tIdx, tbl) => {
    const headers = [];
    $(tbl)
      .find('th')
      .each((_, th) => {
        headers.push($(th).text().replace(/\s+/g, ' ').trim());
      });

    const rows = [];
    $(tbl)
      .find('tr')
      .each((rIdx, tr) => {
        const rowCells = [];
        $(tr)
          .find('td')
          .each((cIdx, td) => {
            rowCells.push($(td).text().replace(/\s+/g, ' ').trim());
          });
        if (rowCells.length > 0 && rowCells.some(Boolean)) {
          const rowObj = {};
          rowCells.forEach((cVal, cIdx) => {
            const h = headers[cIdx] || `Column ${cIdx + 1}`;
            rowObj[h] = cVal;
          });
          rows.push(rowObj);
        }
      });

    if (rows.length > 0) {
      tables.push({
        id: `table_${tIdx + 1}`,
        name: `Table ${tIdx + 1} (${rows.length} rows)`,
        columns: headers.length > 0 ? headers : Object.keys(rows[0]),
        rows: rows.slice(0, 500),
      });
    }
  });

  // 8. Auto-detect Repeated Lists / Cards
  const lists = [];
  const candidateSelectors = [
    'article',
    '.card',
    '.item',
    '.post',
    '.profile',
    '.team-member',
    '.directory-item',
    '.listing',
    'li',
  ];

  candidateSelectors.forEach((sel) => {
    if (lists.length > 0) return;
    const items = $(sel);
    if (items.length >= 3 && items.length <= 500) {
      const listRows = [];
      items.each((_, el) => {
        const text = $(el).find('h2, h3, h4, .title, strong').first().text().replace(/\s+/g, ' ').trim() || $(el).text().replace(/\s+/g, ' ').trim().slice(0, 100);
        const link = $(el).find('a[href]').first().attr('href') || '';
        let fullLink = '';
        if (link) {
          try {
            fullLink = new URL(link, origin).href;
          } catch {}
        }
        const img = $(el).find('img[src]').first().attr('src') || '';
        let fullImg = '';
        if (img) {
          try {
            fullImg = new URL(img, origin).href;
          } catch {}
        }

        if (text) {
          listRows.push({
            Title: text,
            Link: fullLink,
            Image: fullImg,
            Snippet: $(el).find('p, .desc, .description').first().text().replace(/\s+/g, ' ').trim().slice(0, 150),
          });
        }
      });

      if (listRows.length >= 3) {
        lists.push({
          id: `list_${sel.replace(/[^a-z0-9]/gi, '_')}`,
          name: `Detected ${sel} Cards (${listRows.length} items)`,
          columns: ['Title', 'Link', 'Image', 'Snippet'],
          rows: listRows.slice(0, 500),
        });
      }
    }
  });

  // 9. Links Detection (Internal vs External, rel, anchor text)
  const links = [];
  $('a[href]').each((_, el) => {
    const href = ($(el).attr('href') || '').trim();
    const anchor = $(el).text().replace(/\s+/g, ' ').trim();
    const rel = ($(el).attr('rel') || '').toLowerCase();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;

    try {
      const fullUrl = new URL(href, origin).href;
      const isExternal = new URL(fullUrl).origin !== origin;
      links.push({
        Anchor: anchor || '(No text)',
        URL: fullUrl,
        Type: isExternal ? 'External' : 'Internal',
        Rel: rel || 'follow',
      });
    } catch {}
  });

  // 10. Structured Data (JSON-LD)
  const structuredData = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html();
      if (content) {
        const parsed = JSON.parse(content);
        structuredData.push(parsed);
      }
    } catch {}
  });

  // 11. Main Text & Headings
  const headings = [];
  $('h1, h2, h3').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text) headings.push(`${el.tagName.toUpperCase()}: ${text}`);
  });

  return {
    url: pageUrl,
    domain: urlObj.hostname.replace(/^www\./, ''),
    title,
    description,
    siteName,
    language,
    cms,
    emails,
    primaryEmail: emails[0]?.email || '',
    phones: Array.from(phones),
    primaryPhone: Array.from(phones)[0] || '',
    socials,
    contactPageUrl,
    guestPostPageUrl,
    hasGuestPostPage: Boolean(guestPostPageUrl),
    candidateSubpages: Array.from(discoveredSubpages),
    authors: Array.from(authors),
    latestDate,
    tables,
    lists,
    links: links.slice(0, 500),
    structuredData,
    headings: headings.slice(0, 50),
  };
}
