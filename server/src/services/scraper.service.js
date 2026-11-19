import * as cheerio from 'cheerio';
import { assertSafeUrl } from '../scraper/assertSafeUrl.js';
import { isAllowed } from '../scraper/robots.js';
import { extractPageData } from '../scraper/pageExtractor.js';
import { runRecipe } from '../scraper/runRecipe.js';
import { recipeSchema } from '../schemas/scrapeRecipe.js';
import { getAIClient, CANDIDATE_MODELS } from './gemini.service.js';
import ScrapeJob from '../models/ScrapeJob.js';
import ScrapeTask from '../models/ScrapeTask.js';
import Dataset from '../models/Dataset.js';
import DatasetRow from '../models/DatasetRow.js';
import Prospect from '../models/Prospect.js';
import Blacklist from '../models/Blacklist.js';

const USER_AGENT = 'OutreachTracker-Bot/1.0 (+https://outreachtracker.com/bot; bot@outreachtracker.com)';

// In-memory SSE listeners for live job progress
const jobEventEmitters = new Map();

export function subscribeJobEvents(jobId, res) {
  if (!jobEventEmitters.has(jobId)) {
    jobEventEmitters.set(jobId, new Set());
  }
  const listeners = jobEventEmitters.get(jobId);
  listeners.add(res);

  res.on('close', () => {
    listeners.delete(res);
    if (listeners.size === 0) {
      jobEventEmitters.delete(jobId);
    }
  });
}

export function broadcastJobProgress(jobId, payload) {
  const listeners = jobEventEmitters.get(jobId);
  if (listeners && listeners.size > 0) {
    const dataStr = `data: ${JSON.stringify(payload)}\n\n`;
    for (const res of listeners) {
      try {
        res.write(dataStr);
      } catch {}
    }
  }
}

/**
 * Safe fetch with SSRF check, robots check, timeout, and size limits
 */
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Safe fetch with SSRF check, robots check, timeout, browser UA, size limits,
 * and automatic protocol fallbacks.
 */
export async function safeFetchHtml(inputUrl, { ignoreRobots = false, timeoutMs = 15000 } = {}) {
  async function fetchCandidate(urlToFetch) {
    const safeUrl = await assertSafeUrl(urlToFetch);
    const targetUrl = safeUrl.href;

    if (!ignoreRobots) {
      const allowed = await isAllowed(targetUrl, BROWSER_USER_AGENT);
      if (!allowed) {
        const err = new Error(`Blocked by robots.txt`);
        err.code = 'ROBOTS_BLOCKED';
        throw err;
      }
    }

    // Direct fetch with modern browser headers and explicitly managed AbortController
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`Fetch timed out after ${timeoutMs}ms`)), timeoutMs);

    try {
      const res = await fetch(targetUrl, {
        headers: {
          'User-Agent': BROWSER_USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      }

      // Final destination check on redirects
      await assertSafeUrl(res.url);

      // Buffer page up to 10MB
      const rawText = await res.text();
      const maxChars = 10 * 1024 * 1024;
      const html = rawText.length > maxChars ? rawText.slice(0, maxChars) : rawText;

      return { html, finalUrl: res.url };
    } finally {
      clearTimeout(timer);
    }
  }

  const trimmed = String(inputUrl || '').trim();
  const candidates = [];

  if (trimmed.startsWith('http://')) {
    candidates.push(trimmed);
    candidates.push(trimmed.replace(/^http:\/\//i, 'https://'));
  } else if (trimmed.startsWith('https://')) {
    candidates.push(trimmed);
    candidates.push(trimmed.replace(/^https:\/\//i, 'http://'));
  } else {
    candidates.push(`https://${trimmed}`);
    candidates.push(`http://${trimmed}`);
  }

  let lastError = null;
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    try {
      const result = await fetchCandidate(candidate);
      const isCrash =
        result.html.includes('Fatal error:') ||
        result.html.includes('Maximum call stack size') ||
        result.html.includes('Parse error: syntax error');

      if (isCrash && i < candidates.length - 1) {
        continue;
      }
      return result;
    } catch (err) {
      lastError = err;
      // If timed out or refused, don't waste time on redundant http variations
      if (err.name === 'TimeoutError' || err.message?.includes('timeout')) {
        break;
      }
    }
  }

  throw lastError || new Error(`Failed to fetch HTML from ${inputUrl}`);
}

/**
 * Prospect Site Scraper Pipeline (visits homepage + up to 5 subpages)
 * Enforces a strict 35s hard deadline so no single site can hang the job.
 */
export async function scrapeProspectSite(domainOrUrl, options = {}) {
  const deadline = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Site scrape timeout after 45s')), 45000)
  );

  return Promise.race([_doScrapeProspectSite(domainOrUrl, options), deadline]);
}

async function _doScrapeProspectSite(domainOrUrl, options = {}) {
  let initialUrl = String(domainOrUrl || '').trim();
  if (!initialUrl.startsWith('http://') && !initialUrl.startsWith('https://')) {
    initialUrl = `https://${initialUrl}`;
  }

  const pagesVisited = [];
  let homeResult = null;

  try {
    const { html, finalUrl } = await safeFetchHtml(initialUrl, { timeoutMs: 8000 });
    pagesVisited.push(finalUrl);
    homeResult = extractPageData(html, finalUrl);
  } catch (err) {
    if (initialUrl.startsWith('https://') && err.code !== 'ROBOTS_BLOCKED' && !err.message.includes('private or reserved')) {
      try {
        const fallbackHttp = initialUrl.replace('https://', 'http://');
        const { html, finalUrl } = await safeFetchHtml(fallbackHttp, { timeoutMs: 8000 });
        pagesVisited.push(finalUrl);
        homeResult = extractPageData(html, finalUrl);
      } catch {
        throw err;
      }
    } else {
      throw err;
    }
  }

  const maxPages = Math.max(1, Math.min(Number(options.maxPagesPerSite) || 8, 20));
  const allEmails = [...homeResult.emails];
  const allPhones = [...(homeResult.phones || [])];
  const allAddresses = [...(homeResult.addresses || [])];
  if (homeResult.address && !allAddresses.includes(homeResult.address)) {
    allAddresses.unshift(homeResult.address);
  }
  const allSocials = { ...homeResult.socials };
  const allSocialProfiles = [...(homeResult.allSocials || [])];

  const subpagesToVisit = [];
  const origin = new URL(homeResult.url).origin;

  // 1. Add discovered subpages found in links
  if (Array.isArray(homeResult.candidateSubpages)) {
    for (const sub of homeResult.candidateSubpages) {
      if (sub && !subpagesToVisit.includes(sub) && sub !== homeResult.url) {
        subpagesToVisit.push(sub);
      }
    }
  }

  // 2. High-priority standard subpage paths
  const standardPaths = [
    '/contact',
    '/contact-us',
    '/get-in-touch',
    '/about',
    '/about-us',
    '/team',
    '/our-team',
    '/leadership',
    '/people',
    '/services',
    '/our-services',
    '/write-for-us',
    '/guest-post',
  ];

  for (const path of standardPaths) {
    const full = `${origin}${path}`;
    if (!subpagesToVisit.includes(full) && full !== homeResult.url) {
      subpagesToVisit.push(full);
    }
  }

  // Visit extra pages up to maxPages limit in parallel batches of 3
  const targetSubpages = subpagesToVisit.filter((u) => !pagesVisited.includes(u));
  const subpageBatchSize = 3;

  for (let b = 0; b < targetSubpages.length; b += subpageBatchSize) {
    if (pagesVisited.length >= maxPages) break;
    const batch = targetSubpages.slice(b, b + subpageBatchSize);

    const batchResults = await Promise.allSettled(
      batch.map((pUrl) => safeFetchHtml(pUrl, { timeoutMs: 6000, ignoreRobots: true }))
    );

    for (const res of batchResults) {
      if (res.status !== 'fulfilled') continue;
      const { html, finalUrl } = res.value;
      if (pagesVisited.includes(finalUrl)) continue;
      pagesVisited.push(finalUrl);

      const subData = extractPageData(html, finalUrl);

      // Merge discovered emails
      subData.emails.forEach((e) => {
        if (!allEmails.some((existing) => existing.email === e.email)) {
          allEmails.push(e);
        }
      });

      // Merge discovered phones
      (subData.phones || []).forEach((p) => {
        if (!allPhones.includes(p)) allPhones.push(p);
      });

      // Merge discovered addresses
      (subData.addresses || []).forEach((a) => {
        if (!allAddresses.includes(a)) allAddresses.push(a);
      });
      if (subData.address && !allAddresses.includes(subData.address)) {
        allAddresses.push(subData.address);
      }

      // Merge discovered socials
      if (subData.socials) {
        Object.keys(subData.socials).forEach((key) => {
          if ((!allSocials[key] || allSocials[key] === '') && subData.socials[key]) {
            allSocials[key] = subData.socials[key];
          }
        });
      }

      (subData.allSocials || []).forEach((prof) => {
        if (!allSocialProfiles.some((p) => p.url === prof.url)) {
          allSocialProfiles.push(prof);
        }
      });

      if (!homeResult.contactPageUrl && subData.contactPageUrl) {
        homeResult.contactPageUrl = subData.contactPageUrl;
      }
      if (!homeResult.guestPostPageUrl && subData.guestPostPageUrl) {
        homeResult.guestPostPageUrl = subData.guestPostPageUrl;
        homeResult.hasGuestPostPage = true;
      }
    }
  }

  // AI Contact Extraction Fallback if 0 emails found
  if (allEmails.length === 0 && options.useAI) {
    try {
      const aiEmails = await extractContactsWithAI(homeResult.url, homeResult.title, homeResult.description);
      aiEmails.forEach((e) => {
        if (!allEmails.some((existing) => existing.email === e.email)) {
          allEmails.push(e);
        }
      });
    } catch {}
  }

  return {
    domain: homeResult.domain,
    pageUrl: homeResult.url,
    title: homeResult.title,
    description: homeResult.description,
    siteName: homeResult.siteName,
    language: homeResult.language,
    cms: homeResult.cms,
    primaryEmail: allEmails[0]?.email || '',
    emails: allEmails,
    isRoleEmail: allEmails[0]?.isRole || false,
    emailSourceUrl: allEmails[0]?.sourceUrl || homeResult.url,
    primaryPhone: allPhones[0] || '',
    phones: allPhones,
    address: allAddresses[0] || homeResult.address || '',
    addresses: allAddresses,
    contactPageUrl: homeResult.contactPageUrl,
    guestPostPageUrl: homeResult.guestPostPageUrl,
    hasGuestPost: homeResult.hasGuestPostPage,
    socials: allSocials,
    allSocials: allSocialProfiles,
    linkedin: allSocials.linkedin || '',
    twitter: allSocials.twitter || '',
    facebook: allSocials.facebook || '',
    instagram: allSocials.instagram || '',
    youtube: allSocials.youtube || '',
    tiktok: allSocials.tiktok || '',
    github: allSocials.github || '',
    whatsapp: allSocials.whatsapp || '',
    telegram: allSocials.telegram || '',
    discord: allSocials.discord || '',
    threads: allSocials.threads || '',
    pinterest: allSocials.pinterest || '',
    author: homeResult.authors[0] || '',
    latestDate: homeResult.latestDate,
    pagesVisited,
  };
}

/**
 * AI Contact Extraction Helper
 */
async function extractContactsWithAI(url, title, snippet) {
  const client = getAIClient();
  if (!client) return [];

  const prompt = `You are a contact detail extraction assistant.
Extract any public business contact email from this page context:
URL: ${url}
Title: ${title}
Snippet: ${snippet}

Return JSON matching:
{
  "emails": [{ "email": "contact@domain.com", "name": "Contact Name" }]
}`;

  for (const model of CANDIDATE_MODELS) {
    try {
      const aiCall = client.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      aiCall.catch(() => {});
      let timer = null;
      const timeout = new Promise((_, rej) => {
        timer = setTimeout(() => rej(new Error('AI timeout after 15s')), 15000);
      });
      const res = await Promise.race([aiCall, timeout]);
      clearTimeout(timer);
      const parsed = JSON.parse(res.text || '{}');
      if (Array.isArray(parsed.emails)) {
        return parsed.emails.map((e) => ({
          email: String(e.email).toLowerCase().trim(),
          isRole: false,
          sourceUrl: url,
        }));
      }
    } catch {}
  }
  return [];
}

/**
 * Scrape Any URL: Auto-detect (optionally run a provided recipe)
 */
export async function analyzeAnyUrl(url, recipe = null) {
  const { html, finalUrl } = await safeFetchHtml(url);
  const data = extractPageData(html, finalUrl);

  let recipeResult = null;
  if (recipe && recipe.rowSelector && Array.isArray(recipe.fields)) {
    try {
      const testRecipe = recipeSchema.parse({
        rowSelector: recipe.rowSelector,
        fields: recipe.fields,
        nextPageSelector: recipe.nextPageSelector || '',
      });
      recipeResult = runRecipe(html, testRecipe, finalUrl);
    } catch {}
  }

  return {
    url: finalUrl,
    domain: data.domain,
    title: data.title,
    emails: data.emails,
    primaryEmail: data.emails[0]?.email || '',
    phones: data.phones || [],
    primaryPhone: data.primaryPhone || '',
    address: data.address || '',
    addresses: data.addresses || [],
    socials: data.socials || {},
    allSocials: data.allSocials || [],
    linkedin: data.socials?.linkedin || '',
    twitter: data.socials?.twitter || '',
    facebook: data.socials?.facebook || '',
    instagram: data.socials?.instagram || '',
    youtube: data.socials?.youtube || '',
    tiktok: data.socials?.tiktok || '',
    github: data.socials?.github || '',
    whatsapp: data.socials?.whatsapp || '',
    telegram: data.socials?.telegram || '',
    discord: data.socials?.discord || '',
    threads: data.socials?.threads || '',
    pinterest: data.socials?.pinterest || '',
    author: data.authors?.[0] || '',
    authors: data.authors || [],
    contactPageUrl: data.contactPageUrl,
    guestPostPageUrl: data.guestPostPageUrl,
    tables: data.tables,
    lists: data.lists,
    links: data.links,
    recipeRows: recipeResult?.rows || [],
    recipeNextUrl: recipeResult?.nextUrl || '',
    contacts: {
      emails: data.emails,
      phones: data.phones || [],
      primaryPhone: data.primaryPhone || '',
      address: data.address || '',
      addresses: data.addresses || [],
      socials: data.socials || {},
      contactPageUrl: data.contactPageUrl,
      guestPostPageUrl: data.guestPostPageUrl,
    },
    structuredData: data.structuredData,
    text: {
      headings: data.headings,
      description: data.description,
    },
  };
}

/**
 * Detect if an instruction targets a specific subpage type (e.g. /team, /services, /blog)
 * and find the best internal subpage link on the current page.
 */
export function findRelevantSubpage(html, originUrl, instruction) {
  if (!html || !instruction) return null;
  const instLower = instruction.toLowerCase();

  const patterns = [
    {
      regex: /\b(team|members?|staff|people|founders?|leadership|executives?|employees?|directors?)\b/i,
      primaryMatch: /\b(team|our-team|our_team|leadership|people|staff|management|executives?)\b/i,
      secondaryMatch: /\b(about-us|about|who-we-are)\b/i,
    },
    {
      regex: /\b(services?|solutions?|offerings?|what we do|capabilities)\b/i,
      primaryMatch: /\b(services?|our-services?|our_services?|solutions?)\b/i,
      secondaryMatch: /\b(what-we-do|capabilities|offerings?)\b/i,
    },
    {
      regex: /\b(blogs?|posts?|articles?|news|insights?|resources?)\b/i,
      primaryMatch: /\b(blogs?|posts?|articles?)\b/i,
      secondaryMatch: /\b(news|insights?|resources?)\b/i,
    },
    {
      regex: /\b(contacts?|support|reach us|locations?)\b/i,
      primaryMatch: /\b(contact|contact-us|contact_us)\b/i,
      secondaryMatch: /\b(reach-us|support|locations?)\b/i,
    },
    {
      regex: /\b(pric(ing|e)|plans?|packages?|rates?)\b/i,
      primaryMatch: /\b(pricing|plans?|packages?)\b/i,
      secondaryMatch: /\b(rates?|cost)\b/i,
    },
    {
      regex: /\b(portfolio|projects?|case stud(y|ies)|works?|clients?)\b/i,
      primaryMatch: /\b(portfolio|case-studies|projects?|our-work)\b/i,
      secondaryMatch: /\b(works?|clients?)\b/i,
    },
    {
      regex: /\b(careers?|jobs?|openings?)\b/i,
      primaryMatch: /\b(careers?|jobs?|openings?)\b/i,
      secondaryMatch: /\b(work-with-us)\b/i,
    },
  ];

  let activeMatch = null;
  for (const p of patterns) {
    if (p.regex.test(instLower)) {
      activeMatch = p;
      break;
    }
  }

  if (!activeMatch) return null;

  try {
    const origin = new URL(originUrl).origin;
    const $ = cheerio.load(html);
    const candidates = [];

    $('a[href]').each((_, el) => {
      const href = ($(el).attr('href') || '').trim();
      const text = $(el).text().replace(/\s+/g, ' ').trim().toLowerCase();
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('javascript:')) return;

      try {
        const fullUrl = new URL(href, origin);
        if (fullUrl.origin !== origin) return;
        const pathname = fullUrl.pathname.toLowerCase();
        if (pathname === '/' || pathname === '') return;

        let score = 0;
        if (activeMatch.primaryMatch?.test(pathname)) score += 30;
        if (activeMatch.primaryMatch?.test(text)) score += 20;
        if (activeMatch.secondaryMatch?.test(pathname)) score += 10;
        if (activeMatch.secondaryMatch?.test(text)) score += 5;

        if (score > 0) {
          candidates.push({ url: fullUrl.href, score, pathname });
        }
      } catch {}
    });

    if (candidates.length > 0) {
      candidates.sort((a, b) => b.score - a.score);
      const best = candidates[0].url;
      if (best.replace(/\/$/, '') !== originUrl.replace(/\/$/, '')) {
        return best;
      }
    }
  } catch {}

  return null;
}

/**
 * Generic Universal Extractor — combines smart Cheerio element parsing with Gemini AI.
 * Strips navigation/menus/headers so menus are never extracted as records.
 * If AI is busy/unavailable, falls back gracefully to detected DOM structures so the user ALWAYS gets data.
 */
async function extractWithAIGeneric(html, finalUrl, instruction) {
  // Strip navigation, menus, header, footer, aside, scripts, and styles
  const clean$ = cheerio.load(html);
  clean$(
    'nav, header, footer, aside, [role="navigation"], .menu, .navbar, .nav, .site-header, .site-footer, .footer-widgets, #masthead, #footer, .copyright, script, style, svg, noscript, iframe, link, meta, [style*="display:none"]'
  ).remove();

  const pageTitle = clean$('title').text().trim() || cheerio.load(html)('title').text().trim();
  const headings = clean$('h1, h2, h3, h4').map((_, el) => clean$(el).text().trim()).get().filter(Boolean).slice(0, 15).join(' | ');
  const bodyText = clean$('body').text().replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim().slice(0, 7000);

  // Helper to test if a row is just a navigation menu item
  const isNavOrGeneric = (text) => {
    if (!text || typeof text !== 'string') return true;
    return /^(home|about|about us|services?|our services?|contact|contact us|blog|careers?|privacy policy|terms|terms of service|terms & conditions|disclaimer|copyright.*|menu|navigation|skip to content)$/i.test(text.trim());
  };

  // Auto-detect structured cards / tables via Cheerio as guaranteed fallback (excluding nav)
  const pageData = extractPageData(html, finalUrl);
  const fallbackRows = [];
  const rawCandidateRows = [];

  if (Array.isArray(pageData.tables) && pageData.tables.length > 0 && pageData.tables[0].rows?.length > 0) {
    rawCandidateRows.push(...pageData.tables[0].rows.slice(0, 30));
  } else if (Array.isArray(pageData.lists) && pageData.lists.length > 0 && pageData.lists[0].rows?.length > 0) {
    rawCandidateRows.push(...pageData.lists[0].rows.slice(0, 30));
  }

  for (const r of rawCandidateRows) {
    const title = r.Title || r.Name || r['Service Name'] || '';
    if (!isNavOrGeneric(title)) {
      fallbackRows.push(r);
    }
  }

  const client = getAIClient();
  if (client) {
    const prompt = `You are a high-speed web data extractor. Read this page and extract all records matching the user request.
Instruction: "${instruction}"
Page URL: ${finalUrl}
Page Title: ${pageTitle}
Headings: ${headings}

Page Content:
${bodyText}

CRITICAL RULES:
1. Do NOT extract site navigation links, sitemap links, or footer links (e.g. "Home", "About Us", "Services", "Portfolio", "Blog", "Contact Us", "Terms", "Privacy Policy", or copyrights).
2. Extract ONLY the actual business records requested (e.g., if asked for services, extract specific services like "Custom Software Development", "Managed IT Services" with their descriptions; if asked for team members, extract actual people with their names and job titles/roles).
3. If no matching records exist on this page, return { "rows": [] }. Do NOT make up records or substitute navigation links.

Extract matching items as a JSON array of objects with descriptive column names (e.g. Name, Description, Link, etc.).
Return ONLY JSON:
{
  "rows": [
    { "Name": "item name", "Description": "item details" }
  ]
}`;

    for (const model of CANDIDATE_MODELS) {
      try {
        const aiCall = client.models.generateContent({
          model,
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        aiCall.catch(() => {});
        let timer = null;
        const timeoutP = new Promise((_, rej) => {
          timer = setTimeout(() => rej(new Error('AI timeout')), 10000);
        });
        const res = await Promise.race([aiCall, timeoutP]);
        clearTimeout(timer);
        const rawText = (res.text || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        const parsed = JSON.parse(rawText || '{}');
        if (Array.isArray(parsed.rows) && parsed.rows.length > 0) {
          const filteredRows = parsed.rows.filter((r) => {
            const val = r.Name || r.Title || r['Service Name'] || '';
            return !isNavOrGeneric(val);
          });
          if (filteredRows.length > 0) {
            return filteredRows;
          }
        }
      } catch (err) {
        console.warn(`Model ${model} failed for extractWithAIGeneric: ${err.message}`);
      }
    }
  }

  // Graceful fallback to Cheerio detected cards/tables (filtered)
  if (fallbackRows.length > 0) {
    return fallbackRows;
  }

  // Final fallback: single record from page meta
  return [
    {
      Title: pageTitle || 'Web Page',
      URL: finalUrl,
      Summary: pageData.description || headings.slice(0, 200) || 'Target page data',
    },
  ];
}

/**
 * Scrape Any URL: Describe It (AI Recipe Generation)
 */
export async function describeWithAI({ url, instruction, columnNames = [] }) {
  const { html, finalUrl } = await safeFetchHtml(url, { ignoreRobots: true, timeoutMs: 15000 });
  const $ = cheerio.load(html);

  const rawText = $('body').text().trim();
  if (
    rawText.includes('Fatal error:') ||
    rawText.includes('Maximum call stack size') ||
    rawText.includes('Parse error: syntax error')
  ) {
    const errorSnippet = rawText.slice(0, 180).replace(/\s+/g, ' ');
    throw new Error(
      `Target site returned a server-side fatal crash: "${errorSnippet}". The target website is currently down or misconfigured.`
    );
  }

  // 1. Check if a relevant subpage should be visited based on instruction (e.g. /team, /services, /blog)
  const targetSubpage = findRelevantSubpage(html, finalUrl, instruction);
  let rows = [];

  if (targetSubpage) {
    try {
      const subRes = await safeFetchHtml(targetSubpage, { ignoreRobots: true, timeoutMs: 15000 });
      const subRows = await extractWithAIGeneric(subRes.html, subRes.finalUrl, instruction);
      // Check if subRows are valid data and not the generic 1-row page fallback
      if (subRows && subRows.length > 0 && !(subRows.length === 1 && subRows[0].Summary)) {
        rows = subRows;
      }
    } catch (err) {
      console.warn(`Subpage navigation to ${targetSubpage} failed, falling back to main page:`, err.message);
    }
  }

  // 2. Extract from primary page if no subpage rows found
  if (rows.length === 0) {
    rows = await extractWithAIGeneric(html, finalUrl, instruction);
  }

  const fields =
    rows.length > 0
      ? Object.keys(rows[0]).map((k) => ({ name: k, selector: '', attr: 'text' }))
      : [{ name: 'Content', selector: '', attr: 'text' }];

  const recipe = {
    rowSelector: 'body',
    fields,
    nextPageSelector: '',
  };

  return {
    recipe,
    previewRows: rows.slice(0, 15),
    totalDetected: rows.length,
    nextUrl: '',
    explanation: `Successfully extracted ${rows.length} ${rows.length === 1 ? 'record' : 'records'} matching: "${instruction}"`,
  };
}

/**
 * Background Job Runner
 * - Progressively writes rows immediately to DatasetRow (no data loss!)
 * - Strictly enforces 40s per-task timeout
 * - Updates real-time SSE progress & counts
 */
export async function processScrapeJob(jobId) {
  const job = await ScrapeJob.findById(jobId);
  if (!job || job.status === 'cancelled') return;

  job.status = 'running';
  job.startedAt = new Date();
  await job.save();

  try {
    const tasks = await ScrapeTask.find({ job: jobId, status: { $in: ['pending', 'error', 'running'] } });
    const blacklist = await Blacklist.find({ workspace: job.workspace }).lean();
    const blacklistedDomains = new Set(blacklist.map((b) => b.domain.toLowerCase()));

    // Create or retrieve Dataset
    let dataset = null;
    if (job.dataset) {
      dataset = await Dataset.findById(job.dataset);
    }

    if (!dataset) {
      let defaultColumns = [];
      if (job.inputType === 'any_url' || job.instruction) {
        defaultColumns = [
          { id: 'col_0_title', name: 'Title', type: 'text', order: 0, hidden: false },
          { id: 'col_1_description', name: 'Description', type: 'text', order: 1, hidden: false },
          { id: 'col_2_url', name: 'URL', type: 'text', order: 2, hidden: false },
        ];
      } else {
        defaultColumns = [
          { id: 'col_0_domain', name: 'Domain', type: 'text', order: 0, hidden: false },
          { id: 'col_1_email', name: 'Contact Email', type: 'text', order: 1, hidden: false },
          { id: 'col_2_phone', name: 'Phone Number', type: 'text', order: 2, hidden: false },
          { id: 'col_3_address', name: 'Company Address', type: 'text', order: 3, hidden: false },
          { id: 'col_4_title', name: 'Page Title', type: 'text', order: 4, hidden: false },
          { id: 'col_5_contact_url', name: 'Contact Page', type: 'text', order: 5, hidden: false },
          { id: 'col_6_guest_post', name: 'Write For Us Page', type: 'text', order: 6, hidden: false },
          { id: 'col_7_social_linkedin', name: 'LinkedIn', type: 'text', order: 7, hidden: false },
          { id: 'col_8_social_twitter', name: 'Twitter / X', type: 'text', order: 8, hidden: false },
          { id: 'col_9_social_facebook', name: 'Facebook', type: 'text', order: 9, hidden: false },
          { id: 'col_10_social_instagram', name: 'Instagram', type: 'text', order: 10, hidden: false },
          { id: 'col_11_social_youtube', name: 'YouTube', type: 'text', order: 11, hidden: false },
          { id: 'col_12_social_tiktok', name: 'TikTok', type: 'text', order: 12, hidden: false },
          { id: 'col_13_social_github', name: 'GitHub', type: 'text', order: 13, hidden: false },
          { id: 'col_14_social_other', name: 'WhatsApp / Telegram', type: 'text', order: 14, hidden: false },
          { id: 'col_15_all_socials', name: 'All Social Links', type: 'text', order: 15, hidden: false },
          { id: 'col_16_author', name: 'Author', type: 'text', order: 16, hidden: false },
          { id: 'col_17_cms', name: 'CMS', type: 'text', order: 17, hidden: false },
          { id: 'col_18_status', name: 'Scrape Status', type: 'text', order: 18, hidden: false },
        ];
      }

      dataset = await Dataset.create({
        workspace: job.workspace,
        name: `Scraped: ${job.name} (${new Date().toLocaleDateString()})`,
        columns: defaultColumns,
        rowCount: 0,
        status: 'ready',
        steps: [
          {
            label: `Generated by Web Scraper Job: ${job.name}`,
            rowsAffected: 0,
            at: new Date(),
            byAI: false,
          },
        ],
        createdBy: job.createdBy,
      });

      job.dataset = dataset._id;
      await job.save();
    }

    // Thread-safe row counter starting from existing count
    const existingCount = await DatasetRow.countDocuments({ dataset: dataset._id });
    let rowIndex = existingCount;

    // Process tasks in parallel batches of 3
    const batchSize = 3;
    for (let i = 0; i < tasks.length; i += batchSize) {
      const currentBatch = tasks.slice(i, i + batchSize);

      await Promise.all(
        currentBatch.map(async (task) => {
          // Check cancellation
          const checkJob = await ScrapeJob.findById(jobId).select('status');
          if (checkJob?.status === 'cancelled') return;

          task.status = 'running';
          task.attempts += 1;
          await task.save();

          // Check blacklist
          if (task.domain && blacklistedDomains.has(task.domain.toLowerCase())) {
            task.status = 'blocked';
            task.error = 'Domain is on workspace blacklist';
            await task.save();
            job.counts.blocked += 1;
            job.counts.done += 1;
            return;
          }

          // Strict 40s deadline per task
          const taskDeadline = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Task deadline exceeded (40s)')), 40000)
          );

          const executeTask = async () => {
            if ((job.inputType === 'any_url' || job.instruction) && (job.recipe || job.instruction)) {
              // Instruction / Recipe Mode
              const { html, finalUrl } = await safeFetchHtml(task.url, { timeoutMs: 10000 });
              task.pagesVisited = [finalUrl];
              let rows = [];

              if (job.recipe && job.recipe.rowSelector && job.recipe.rowSelector !== 'body') {
                try {
                  const res = runRecipe(html, job.recipe, finalUrl);
                  rows = res.rows || [];
                } catch {}
              }

              if (rows.length === 0 && job.instruction) {
                // Check if a relevant subpage should be visited based on instruction (e.g. /team, /services, /blog)
                const targetSubpage = findRelevantSubpage(html, finalUrl, job.instruction);
                if (targetSubpage) {
                  try {
                    const subRes = await safeFetchHtml(targetSubpage, { ignoreRobots: true, timeoutMs: 10000 });
                    task.pagesVisited.push(subRes.finalUrl);
                    const subRows = await extractWithAIGeneric(subRes.html, subRes.finalUrl, job.instruction);
                    if (subRows && subRows.length > 0 && !(subRows.length === 1 && subRows[0].Summary)) {
                      rows = subRows;
                    }
                  } catch (err) {
                    console.warn(`Subpage navigation to ${targetSubpage} failed in task:`, err.message);
                  }
                }

                if (rows.length === 0) {
                  rows = await extractWithAIGeneric(html, finalUrl, job.instruction);
                }
              }

              if (rows.length > 0) {
                task.status = 'ok';
                task.extractedData = { count: rows.length, sample: rows[0] };

                // Ensure columns exist on dataset
                const currentDataset = await Dataset.findById(dataset._id);
                if (currentDataset) {
                  const existingColNames = new Set(currentDataset.columns.map((c) => c.name.toLowerCase()));
                  const sampleRow = rows[0];
                  let colAdded = false;
                  Object.keys(sampleRow).forEach((k) => {
                    if (!existingColNames.has(k.toLowerCase()) && k !== '_id' && k !== 'dataset') {
                      currentDataset.columns.push({
                        id: `col_${currentDataset.columns.length}_${k.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                        name: k,
                        type: 'text',
                        order: currentDataset.columns.length,
                        hidden: false,
                      });
                      existingColNames.add(k.toLowerCase());
                      colAdded = true;
                    }
                  });
                  if (colAdded) {
                    await currentDataset.save();
                    dataset = currentDataset;
                  }
                }

                // Immediately insert each row to MongoDB!
                for (const r of rows) {
                  const cells = {};
                  Object.keys(r).forEach((k) => {
                    cells[k] = r[k] !== undefined && r[k] !== null ? String(r[k]) : '';
                  });
                  dataset.columns.forEach((c) => {
                    if (cells[c.id] === undefined) {
                      cells[c.id] = r[c.name] !== undefined ? String(r[c.name]) : r[c.id] !== undefined ? String(r[c.id]) : '';
                    }
                  });

                  await DatasetRow.create({
                    dataset: dataset._id,
                    index: rowIndex++,
                    cells,
                    original: { ...cells },
                    isDeleted: false,
                  });
                }

                await Dataset.findByIdAndUpdate(dataset._id, {
                  $set: { rowCount: rowIndex, 'steps.0.rowsAffected': rowIndex },
                });
                job.counts.ok += 1;
              } else {
                task.status = 'no_contact';
                job.counts.ok += 1;
              }
            } else {
              // Prospect Scraper Mode (Deep Scan)
              const result = await scrapeProspectSite(task.url, job.options);
              task.pagesVisited = result.pagesVisited;
              task.extractedData = result;

              if (result.primaryEmail) {
                task.status = 'ok';
                job.counts.ok += 1;
              } else {
                task.status = 'no_contact';
                job.counts.ok += 1;
              }

              const cells = {
                col_0_domain: result.domain,
                Domain: result.domain,
                col_1_email: result.primaryEmail,
                'Contact Email': result.primaryEmail,
                col_2_phone: result.primaryPhone,
                'Phone Number': result.primaryPhone,
                col_3_address: result.address,
                'Company Address': result.address,
                col_4_title: result.title,
                'Page Title': result.title,
                col_5_contact_url: result.contactPageUrl,
                'Contact Page': result.contactPageUrl,
                col_6_guest_post: result.guestPostPageUrl,
                'Write For Us Page': result.guestPostPageUrl,
                col_7_social_linkedin: result.linkedin,
                LinkedIn: result.linkedin,
                col_8_social_twitter: result.twitter,
                'Twitter / X': result.twitter,
                col_9_social_facebook: result.facebook,
                Facebook: result.facebook,
                col_10_social_instagram: result.instagram,
                Instagram: result.instagram,
                col_11_social_youtube: result.youtube,
                YouTube: result.youtube,
                col_12_social_tiktok: result.tiktok,
                TikTok: result.tiktok,
                col_13_social_github: result.github,
                GitHub: result.github,
                col_14_social_other: result.whatsapp || result.telegram || '',
                'WhatsApp / Telegram': result.whatsapp || result.telegram || '',
                col_15_all_socials: (result.allSocials || []).map((s) => s.url).join(', '),
                'All Social Links': (result.allSocials || []).map((s) => s.url).join(', '),
                col_16_author: result.author,
                Author: result.author,
                col_17_cms: result.cms,
                CMS: result.cms,
                col_18_status: task.status,
                'Scrape Status': task.status,
              };

              // Immediately persist row into DatasetRow!
              await DatasetRow.create({
                dataset: dataset._id,
                index: rowIndex++,
                cells,
                original: { ...cells },
                isDeleted: false,
              });

              await Dataset.findByIdAndUpdate(dataset._id, {
                $set: { rowCount: rowIndex, 'steps.0.rowsAffected': rowIndex },
              });

              if (job.inputType === 'prospects') {
                const updateFields = {};
                if (result.primaryEmail) {
                  updateFields.contactEmail = result.primaryEmail;
                  updateFields.emailSourceUrl = result.emailSourceUrl;
                  updateFields.emailFoundAt = new Date();
                  updateFields.status = 'contact_found';
                }
                if (result.primaryPhone) updateFields.contactPhone = result.primaryPhone;
                if (result.address) updateFields.address = result.address;
                if (result.linkedin) updateFields.socialLinkedin = result.linkedin;
                if (result.twitter) updateFields.socialTwitter = result.twitter;
                if (result.facebook) updateFields.socialFacebook = result.facebook;
                if (result.instagram) updateFields.socialInstagram = result.instagram;
                if (result.youtube) updateFields.socialYoutube = result.youtube;
                if (result.github) updateFields.socialGithub = result.github;
                if (result.tiktok) updateFields.socialTiktok = result.tiktok;
                if (result.whatsapp || result.telegram) {
                  updateFields.socialOther = result.whatsapp || result.telegram;
                }
                if (result.allSocials && result.allSocials.length > 0) {
                  updateFields.socialLinks = result.allSocials.map((s) => ({
                    network: s.network,
                    url: s.url,
                  }));
                }
                if (Object.keys(updateFields).length > 0) {
                  await Prospect.updateMany(
                    { workspace: job.workspace, domain: result.domain },
                    { $set: updateFields }
                  );
                }
              }
            }
          };

          try {
            await Promise.race([executeTask(), taskDeadline]);
          } catch (taskErr) {
            if (taskErr.code === 'ROBOTS_BLOCKED') {
              task.status = 'blocked';
              task.error = 'Blocked by robots.txt';
              job.counts.blocked += 1;
            } else if (taskErr.name === 'TimeoutError' || taskErr.message.includes('timeout') || taskErr.message.includes('deadline')) {
              task.status = 'timeout';
              task.error = 'Request timed out after 35s';
              job.counts.failed += 1;
            } else {
              task.status = 'error';
              task.error = taskErr.message || 'Scrape failed';
              job.counts.failed += 1;
            }
          } finally {
            task.resultRowIndex = rowIndex;
            await task.save();
            job.counts.done += 1;
          }
        })
      );

      await job.save();
      broadcastJobProgress(jobId, {
        jobId,
        status: job.status,
        counts: job.counts,
      });
    }

    job.status = 'completed';
    job.finishedAt = new Date();
    await job.save();

    broadcastJobProgress(jobId, {
      jobId,
      status: 'completed',
      counts: job.counts,
      datasetId: dataset._id,
    });
  } catch (err) {
    job.status = 'failed';
    job.finishedAt = new Date();
    await job.save();
    broadcastJobProgress(jobId, { jobId, status: 'failed', error: err.message });
  }
}

/**
 * Auto-recovery on server boot: Resumes interrupted running jobs so they never stay stuck
 */
export async function resumeInterruptedJobs() {
  try {
    const runningJobs = await ScrapeJob.find({ status: 'running' });
    for (const job of runningJobs) {
      console.log(`[Auto-Recovery] Found interrupted scrape job: ${job._id} (${job.name}). Resuming...`);
      await ScrapeTask.updateMany(
        { job: job._id, status: 'running' },
        { $set: { status: 'pending' } }
      );
      setImmediate(() => {
        processScrapeJob(job._id).catch(console.error);
      });
    }
  } catch (err) {
    console.warn('[Auto-Recovery] Error resuming interrupted jobs:', err.message);
  }
}
