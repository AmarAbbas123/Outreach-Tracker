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
    // Avoid false positives: years, zip codes, random short numbers, unix timestamps
    if (
      digitsOnly.length >= 7 &&
      digitsOnly.length <= 15 &&
      !/^(19|20)\d{2}$/.test(cleaned) &&
      !/^\d{5}$/.test(cleaned) &&
      !/^(16|17)\d{10,12}$/.test(digitsOnly)
    ) {
      if (cleaned.includes('-') || cleaned.includes('(') || cleaned.includes('.') || cleaned.startsWith('+') || digitsOnly.length >= 10) {
        phones.add(cleaned);
        if (phones.size >= 10) break;
      }
    }
  }

  // 4. Structured Data (JSON-LD) - parsed early for social & address enrichment
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

  // 5. Social Links (DOM, Schema sameAs, OpenGraph, clean query tracking)
  const socialData = extractSocialProfiles($, structuredData);
  const socials = socialData.socials;

  // 6. Contact, Team & Guest Post Subpages
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

  // 10. Company Address Extraction (JSON-LD, <address>, Microdata, and Contact Classes)
  const companyAddress = extractCompanyAddress($, structuredData);

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
    address: companyAddress.primaryAddress,
    addresses: companyAddress.addresses,
    socials,
    allSocials: socialData.allSocials,
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

/**
 * Extract comprehensive social profiles across DOM, Schema.org sameAs, and OpenGraph
 */
export function extractSocialProfiles($, structuredData = []) {
  const canonicals = {
    linkedin: '',
    twitter: '',
    facebook: '',
    instagram: '',
    youtube: '',
    tiktok: '',
    github: '',
    whatsapp: '',
    telegram: '',
    discord: '',
    threads: '',
    pinterest: '',
    medium: '',
  };

  const allProfiles = [];
  const seenUrls = new Set();

  function addProfile(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    let url = rawUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      if (url.startsWith('//')) url = `https:${url}`;
      else if (url.includes('.com') || url.includes('.me') || url.includes('.org') || url.includes('.gg')) {
        url = `https://${url}`;
      } else {
        return;
      }
    }

    try {
      const u = new URL(url);
      u.searchParams.delete('fbclid');
      u.searchParams.delete('utm_source');
      u.searchParams.delete('utm_medium');
      u.searchParams.delete('utm_campaign');
      u.searchParams.delete('trk');
      u.searchParams.delete('ref');
      u.searchParams.delete('ref_src');
      url = u.href;
    } catch {
      return;
    }

    if (seenUrls.has(url)) return;

    const lower = url.toLowerCase();
    let network = null;

    if (lower.includes('linkedin.com/')) {
      if (!lower.includes('/sharearticle') && !lower.includes('/sharing/')) {
        network = 'linkedin';
      }
    } else if (lower.includes('twitter.com/') || lower.includes('x.com/')) {
      if (!lower.includes('/status/') && !lower.includes('/intent/') && !lower.includes('sharer') && !lower.includes('/share')) {
        network = 'twitter';
      }
    } else if (lower.includes('facebook.com/') || lower.includes('fb.com/') || lower.includes('fb.me/')) {
      if (!lower.includes('sharer') && !lower.includes('plugins') && !lower.includes('/share.') && !lower.includes('/dialog/')) {
        network = 'facebook';
      }
    } else if (lower.includes('instagram.com/')) {
      if (!lower.includes('/explore/') && !lower.includes('/accounts/') && !lower.includes('/p/')) {
        network = 'instagram';
      }
    } else if (lower.includes('youtube.com/') || lower.includes('youtu.be/')) {
      if (!lower.includes('/watch?') && !lower.includes('/embed/')) {
        network = 'youtube';
      }
    } else if (lower.includes('tiktok.com/@')) {
      network = 'tiktok';
    } else if (lower.includes('github.com/')) {
      if (!lower.includes('/pricing') && !lower.includes('/features') && !lower.includes('/topics') && !lower.includes('/site/')) {
        network = 'github';
      }
    } else if (lower.includes('wa.me/') || lower.includes('api.whatsapp.com/') || lower.includes('chat.whatsapp.com/')) {
      network = 'whatsapp';
    } else if (lower.includes('t.me/') || lower.includes('telegram.me/')) {
      network = 'telegram';
    } else if (lower.includes('discord.gg/') || lower.includes('discord.com/invite/')) {
      network = 'discord';
    } else if (lower.includes('threads.net/@')) {
      network = 'threads';
    } else if (lower.includes('pinterest.com/')) {
      if (!lower.includes('pin/create') && !lower.includes('pin.it')) {
        network = 'pinterest';
      }
    } else if (lower.includes('medium.com/')) {
      network = 'medium';
    }

    if (network) {
      seenUrls.add(url);
      allProfiles.push({ network, url });
      if (!canonicals[network]) {
        canonicals[network] = url;
      }
    }
  }

  // 1. Scan links across DOM (href, data-href, data-url)
  $('a[href], a[data-href], [data-social]').each((_, el) => {
    const href = $(el).attr('href') || $(el).attr('data-href') || $(el).attr('data-social') || '';
    addProfile(href);
  });

  // 2. Scan Schema.org sameAs
  function inspectLd(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) return obj.forEach(inspectLd);
    if (obj['@graph'] && Array.isArray(obj['@graph'])) return obj['@graph'].forEach(inspectLd);

    if (Array.isArray(obj.sameAs)) {
      obj.sameAs.forEach(addProfile);
    } else if (typeof obj.sameAs === 'string') {
      addProfile(obj.sameAs);
    }
  }

  if (Array.isArray(structuredData)) {
    structuredData.forEach(inspectLd);
  }

  // 3. Scan OpenGraph & Meta links
  $('meta[property="og:see_also"]').each((_, el) => {
    addProfile($(el).attr('content'));
  });

  return {
    socials: canonicals,
    allSocials: allProfiles,
  };
}

/**
 * Extract physical company/office address using Schema, <address> tags, and contact classes
 */
export function extractCompanyAddress($, structuredData = []) {
  const candidates = [];

  const addAddress = (raw) => {
    if (!raw || typeof raw !== 'string') return;
    let cleaned = raw
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    cleaned = cleaned.replace(/^(office\s+)?address\s*[:\-–—]\s*/i, '');
    cleaned = cleaned.replace(/^(our\s+)?location\s*[:\-–—]\s*/i, '');
    cleaned = cleaned.replace(/^(head\s+office|registered\s+office|hq)\s*[:\-–—]\s*/i, '');
    cleaned = cleaned.replace(/^(visit\s+us\s+at|find\s+us\s+at)\s*[:\-–—]\s*/i, '');
    cleaned = cleaned.trim();

    if (cleaned.length < 10 || cleaned.length > 250) return;
    if (!/[a-zA-Z]{3,}/.test(cleaned)) return; // Must contain words
    const lower = cleaned.toLowerCase();
    if (lower.startsWith('email') || lower.startsWith('phone') || lower.startsWith('http') || lower.includes('@')) return;
    if (lower.includes('all rights reserved') || lower.includes('copyright') || lower.includes('privacy policy')) return;

    if (!candidates.includes(cleaned)) {
      candidates.push(cleaned);
    }
  };

  // 1. JSON-LD structured data (highest precision)
  function inspectLdObj(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach(inspectLdObj);
      return;
    }
    if (obj['@graph'] && Array.isArray(obj['@graph'])) {
      obj['@graph'].forEach(inspectLdObj);
      return;
    }

    if (obj.address) {
      if (typeof obj.address === 'string') {
        addAddress(obj.address);
      } else if (typeof obj.address === 'object') {
        const a = obj.address;
        const street = a.streetAddress || '';
        const locality = a.addressLocality || '';
        const region = a.addressRegion || '';
        const postal = a.postalCode || '';
        const country = typeof a.addressCountry === 'string' ? a.addressCountry : a.addressCountry?.name || '';
        const parts = [street, locality, region, postal, country].filter(Boolean);
        if (parts.length > 0) {
          addAddress(parts.join(', '));
        }
      }
    }

    if (obj['@type'] === 'PostalAddress') {
      const street = obj.streetAddress || '';
      const locality = obj.addressLocality || '';
      const region = obj.addressRegion || '';
      const postal = obj.postalCode || '';
      const country = typeof obj.addressCountry === 'string' ? obj.addressCountry : obj.addressCountry?.name || '';
      const parts = [street, locality, region, postal, country].filter(Boolean);
      if (parts.length > 0) {
        addAddress(parts.join(', '));
      }
    }
  }

  if (Array.isArray(structuredData)) {
    structuredData.forEach(inspectLdObj);
  }

  // 2. Microdata
  $('[itemprop="address"], [itemtype*="PostalAddress"]').each((_, el) => {
    addAddress($(el).text());
  });

  // 3. HTML5 <address> tag
  $('address').each((_, el) => {
    const clone = $(el).clone();
    clone.find('a[href^="tel:"], a[href^="mailto:"]').remove();
    addAddress(clone.text());
  });

  // 4. Targeted CSS selectors
  const addressSelectors = [
    '[class*="contact-info_text"]',
    '[class*="office-address"]',
    '[class*="company-address"]',
    '[class*="footer-address"]',
    '[class*="contact-address"]',
    '[class*="location-text"]',
    '[class*="address-info"]',
    '[class*="address-text"]',
    '.office-location',
    '.contact-address',
  ];

  addressSelectors.forEach((sel) => {
    $(sel).each((_, el) => {
      addAddress($(el).text());
    });
  });

  // 5. Contact / Footer contextual lines
  $('footer, [class*="contact"], [id*="contact"], [class*="footer"]').each((_, container) => {
    const text = $(container).text();
    const lines = text.split(/[\r\n]+/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (/^(office\s+)?address\s*[:\-–—]/i.test(line) || /^(head\s+office|location)\s*[:\-–—]/i.test(line)) {
        addAddress(line);
      }
    }
  });

  let primaryAddress = candidates[0] || '';
  for (const c of candidates) {
    if (
      /(street|st\.|road|rd\.|avenue|ave\.|lane|plaza|building|floor|suite|ste\.|block|drive|dr\.|p\.?o\.?\s*box|\d{5})/i.test(
        c
      )
    ) {
      primaryAddress = c;
      break;
    }
  }

  return {
    addresses: candidates.slice(0, 5),
    primaryAddress,
  };
}
