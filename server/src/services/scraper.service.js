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
 * Safe fetch with SSRF check, robots check, timeout, browser UA fallback, size limits,
 * and automatic protocol / www candidate fallbacks for misconfigured servers.
 */
export async function safeFetchHtml(inputUrl, { ignoreRobots = false } = {}) {
  async function fetchCandidate(urlToFetch) {
    const safeUrl = await assertSafeUrl(urlToFetch);
    const targetUrl = safeUrl.href;

    if (!ignoreRobots) {
      const allowed = await isAllowed(targetUrl, USER_AGENT);
      if (!allowed) {
        const err = new Error(`Blocked by robots.txt`);
        err.code = 'ROBOTS_BLOCKED';
        throw err;
      }
    }

    // Attempt fetch with bot UA, fallback to standard browser UA if blocked/failed
    let res = null;
    try {
      res = await fetch(targetUrl, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
      });
    } catch {}

    if (!res || !res.ok) {
      // Retry with browser UA & realistic headers
      res = await fetch(targetUrl, {
        headers: {
          'User-Agent': BROWSER_USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
        },
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
      });
    }

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    // Final destination check on redirects
    await assertSafeUrl(res.url);

    // Buffer page: allow modern heavy pages up to 15MB, gracefully slice without crashing if larger
    const buffer = await res.arrayBuffer();
    const maxBytes = 15 * 1024 * 1024; // 15MB limit
    const activeBuffer = buffer.byteLength > maxBytes ? buffer.slice(0, maxBytes) : buffer;

    const html = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true }).decode(activeBuffer);
    return { html, finalUrl: res.url };
  }

  // Generate candidate URLs with protocol & www fallbacks
  const trimmed = String(inputUrl || '').trim();
  const candidates = [];
  const addCandidate = (u) => {
    if (u && !candidates.includes(u)) candidates.push(u);
  };

  if (trimmed.startsWith('http://')) {
    addCandidate(trimmed);
    addCandidate(trimmed.replace(/^http:\/\//i, 'https://'));
    const stripped = trimmed.replace(/^http:\/\/(www\.)?/i, 'https://');
    addCandidate(stripped);
  } else if (trimmed.startsWith('https://')) {
    addCandidate(trimmed);
    const stripped = trimmed.replace(/^https:\/\/(www\.)?/i, 'https://');
    addCandidate(stripped);
    addCandidate(trimmed.replace(/^https:\/\//i, 'http://'));
  } else {
    // Bare domain: prioritize https://
    addCandidate(`https://${trimmed}`);
    addCandidate(`http://${trimmed}`);
    if (trimmed.startsWith('www.')) {
      addCandidate(`https://${trimmed.replace(/^www\./i, '')}`);
    } else {
      addCandidate(`https://www.${trimmed}`);
    }
  }

  let lastError = null;
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    try {
      const result = await fetchCandidate(candidate);
      // Check for server-side fatal crash / broken stack traces
      const isCrash =
        result.html.includes('Fatal error:') ||
        result.html.includes('Maximum call stack size') ||
        result.html.includes('Parse error: syntax error');

      // If this candidate returned a fatal crash, try next candidate before accepting
      if (isCrash && i < candidates.length - 1) {
        continue;
      }

      return result;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error(`Failed to fetch HTML from ${inputUrl}`);
}

/**
 * Prospect Site Scraper Pipeline (visits homepage + up to 5 subpages)
 */
export async function scrapeProspectSite(domainOrUrl, options = {}) {
  let initialUrl = String(domainOrUrl || '').trim();
  if (!initialUrl.startsWith('http://') && !initialUrl.startsWith('https://')) {
    initialUrl = `https://${initialUrl}`;
  }

  const pagesVisited = [];
  let homeResult = null;

  try {
    const { html, finalUrl } = await safeFetchHtml(initialUrl);
    pagesVisited.push(finalUrl);
    homeResult = extractPageData(html, finalUrl);
  } catch (err) {
    // If https fails, try http as fallback once
    if (initialUrl.startsWith('https://') && err.code !== 'ROBOTS_BLOCKED' && !err.message.includes('private or reserved')) {
      try {
        const fallbackHttp = initialUrl.replace('https://', 'http://');
        const { html, finalUrl } = await safeFetchHtml(fallbackHttp);
        pagesVisited.push(finalUrl);
        homeResult = extractPageData(html, finalUrl);
      } catch (httpErr) {
        throw err;
      }
    } else {
      throw err;
    }
  }

  // Increase max pages per site up to 50
  const maxPages = Math.max(1, Math.min(Number(options.maxPagesPerSite) || 10, 50));
  const allEmails = [...homeResult.emails];
  const allPhones = [...(homeResult.phones || [])];
  const allAddresses = [...(homeResult.addresses || [])];
  if (homeResult.address && !allAddresses.includes(homeResult.address)) {
    allAddresses.unshift(homeResult.address);
  }
  const allSocials = { ...homeResult.socials };
  const allSocialProfiles = [...(homeResult.allSocials || [])];

  // Subpages to visit: prioritize discovered candidate links, then fallbacks
  const subpagesToVisit = [];
  const origin = new URL(homeResult.url).origin;

  // Add discovered subpages from page links
  if (Array.isArray(homeResult.candidateSubpages)) {
    for (const sub of homeResult.candidateSubpages) {
      if (sub && !subpagesToVisit.includes(sub) && sub !== homeResult.url) {
        subpagesToVisit.push(sub);
      }
    }
  }

  // Common fallbacks if candidate subpages are few
  const standardPaths = [
    '/contact',
    '/contact-us',
    '/about',
    '/about-us',
    '/team',
    '/our-team',
    '/people',
    '/leadership',
    '/write-for-us',
    '/guest-post',
    '/contribute',
    '/impressum',
    '/terms',
    '/privacy-policy',
  ];

  for (const path of standardPaths) {
    const full = `${origin}${path}`;
    if (!subpagesToVisit.includes(full) && full !== homeResult.url) {
      subpagesToVisit.push(full);
    }
  }

  // Visit extra pages up to maxPages limit
  for (const pageUrl of subpagesToVisit) {
    if (pagesVisited.length >= maxPages) break;
    if (pagesVisited.includes(pageUrl)) continue;

    try {
      // 500ms polite delay between subpages on same origin
      await new Promise((r) => setTimeout(r, 500));
      const { html, finalUrl } = await safeFetchHtml(pageUrl);
      pagesVisited.push(finalUrl);

      const subData = extractPageData(html, finalUrl);

      // Merge discovered emails
      subData.emails.forEach((e) => {
        if (!allEmails.some((existing) => existing.email === e.email)) {
          allEmails.push(e);
        }
      });

      // Merge discovered phone numbers
      (subData.phones || []).forEach((p) => {
        if (!allPhones.includes(p)) {
          allPhones.push(p);
        }
      });

      // Merge discovered addresses
      (subData.addresses || []).forEach((a) => {
        if (!allAddresses.includes(a)) {
          allAddresses.push(a);
        }
      });
      if (subData.address && !allAddresses.includes(subData.address)) {
        allAddresses.push(subData.address);
      }

      // Merge discovered social channels
      if (subData.socials) {
        Object.keys(subData.socials).forEach((key) => {
          if ((!allSocials[key] || allSocials[key] === '') && subData.socials[key]) {
            allSocials[key] = subData.socials[key];
          }
        });
      }

      // Merge all distinct social profile links across subpages
      (subData.allSocials || []).forEach((prof) => {
        if (!allSocialProfiles.some((p) => p.url === prof.url)) {
          allSocialProfiles.push(prof);
        }
      });

      // Update contact or guest post page if discovered
      if (!homeResult.contactPageUrl && subData.contactPageUrl) {
        homeResult.contactPageUrl = subData.contactPageUrl;
      }
      if (!homeResult.guestPostPageUrl && subData.guestPostPageUrl) {
        homeResult.guestPostPageUrl = subData.guestPostPageUrl;
        homeResult.hasGuestPostPage = true;
      }
    } catch {}
  }

  // AI Contact Extraction Fallback if 0 emails and AI enabled
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
      const res = await client.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
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
 * Generic Universal AI Extractor for any arbitrary web page & instruction
 */
async function extractWithAIGeneric(html, finalUrl, instruction) {
  const $ = cheerio.load(html);
  $('script, style, svg, noscript, iframe').remove();

  const pageTitle = $('title').text().trim();
  const headings = $('h1, h2, h3').map((_, el) => $(el).text().trim()).get().slice(0, 15).join(' | ');
  const keyLinks = $('a[href]').map((_, el) => `${$(el).text().trim()} (${$(el).attr('href')})`).get().filter((l) => l.length > 5 && !l.startsWith('#')).slice(0, 30).join('\n');
  const bodyText = $('body').text().replace(/\s+/g, ' ').slice(0, 16000);

  const client = getAIClient();
  if (!client) return [];

  const prompt = `You are an expert universal web scraper.
Extract structured records matching this user instruction from the web page text:
Instruction: "${instruction}"
Page URL: ${finalUrl}
Page Title: ${pageTitle}
Headings: ${headings}

Key Links:
${keyLinks}

Page Content:
${bodyText}

Return valid JSON with this exact structure:
{
  "rows": [
    { "field1": "val1", "field2": "val2" }
  ]
}`;

  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await client.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(res.text || '{}');
      if (Array.isArray(parsed.rows) && parsed.rows.length > 0) {
        return parsed.rows;
      }
    } catch (err) {
      console.warn(`Model ${model} failed for extractWithAIGeneric: ${err.message}`);
    }
  }
  return [];
}

/**
 * Scrape Any URL: Describe It (AI Recipe Generation)
 */
export async function describeWithAI({ url, instruction, columnNames = [] }) {
  const { html, finalUrl } = await safeFetchHtml(url, { ignoreRobots: true });
  const $ = cheerio.load(html);

  // Check for server-side fatal crash / broken stack traces
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

  const instLower = String(instruction || '').toLowerCase();
  const needsHeaderFooter =
    instLower.includes('contact') ||
    instLower.includes('address') ||
    instLower.includes('phone') ||
    instLower.includes('email') ||
    instLower.includes('social') ||
    instLower.includes('about') ||
    instLower.includes('company') ||
    instLower.includes('copyright') ||
    instLower.includes('footer') ||
    instLower.includes('overview') ||
    instLower.includes('location');

  // Clean HTML to save tokens and avoid prompt injections
  if (needsHeaderFooter) {
    $('script, style, svg, noscript, iframe, link, meta').remove();
  } else {
    $('script, style, nav, footer, header, svg, noscript, iframe, link, meta').remove();
  }

  // Strip massive attributes and inline data uris
  $('*').each((_, el) => {
    if (el.attribs) {
      Object.keys(el.attribs).forEach((attr) => {
        if (el.attribs[attr] && el.attribs[attr].length > 150) {
          el.attribs[attr] = el.attribs[attr].slice(0, 40) + '...';
        }
      });
    }
  });

  // Detect candidate repeated classes and tags on the page
  const tagCounts = {};
  $('[class]').each((_, el) => {
    const cls = ($(el).attr('class') || '').trim();
    cls.split(/\s+/).forEach((c) => {
      if (c.length > 2 && !c.startsWith('is-') && !c.startsWith('has-')) {
        tagCounts[c] = (tagCounts[c] || 0) + 1;
      }
    });
  });

  const candidateClasses = Object.entries(tagCounts)
    .filter(([_, count]) => count >= 3 && count <= 150)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([cls, count]) => `.${cls} (${count} occurrences)`);

  const pageTitle = $('title').text().trim();
  const headings = $('h1, h2, h3').map((_, el) => $(el).text().trim()).get().slice(0, 15).join(' | ');
  const keyLinks = $('a[href]').map((_, el) => `${$(el).text().trim()} (${$(el).attr('href')})`).get().filter((l) => l.length > 5 && !l.startsWith('#')).slice(0, 30).join('\n');
  const sampleHtml = $('body').html()?.slice(0, 30000) || '';
  const textSample = $('body').text().replace(/\s+/g, ' ').slice(0, 15000);

  const client = getAIClient();
  if (!client) {
    throw new Error('Gemini AI client is not configured.');
  }

  const prompt = `You are a universal AI web scraping engine.
Analyze this web page from "${finalUrl}" and extract the records requested by the user instruction.
The instruction can be ANY generic, custom, or domain-specific request (e.g. list of items, company profile, team members, articles, products, pricing, contacts, etc.).

User Instruction: "${instruction}"
Suggested Columns (if any): ${JSON.stringify(columnNames)}
Page Title: ${pageTitle}
Headings: ${headings}
Candidate Repeated Classes: ${candidateClasses.join(', ') || 'none'}

Key Links:
${keyLinks}

HTML Structure Sample:
${sampleHtml}

Page Text Content:
${textSample}

Return valid JSON with this exact structure:
{
  "mode": "list" | "entity",
  "rowSelector": "css selector identifying each repeated item card/row, or 'body' if single page-level entity",
  "fields": [
    {
      "name": "Column Name",
      "selector": "selector relative to row, or empty if row itself",
      "attr": "text" | "href" | "src"
    }
  ],
  "nextPageSelector": "optional selector for Next pagination link, or empty string",
  "rows": [
    { "Column Name": "Extracted Value" }
  ]
}`;

  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await client.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = JSON.parse(res.text || '{}');
      if (parsed.nextPageSelector === null) parsed.nextPageSelector = '';
      if (!Array.isArray(parsed.fields)) parsed.fields = [];
      parsed.fields.forEach((f) => {
        if (!f.attr || f.attr === null) f.attr = 'text';
      });

      let rows = Array.isArray(parsed.rows) ? parsed.rows : [];
      let nextUrl = '';

      // If mode is list and rowSelector is specified, test Cheerio recipe
      if (parsed.mode !== 'entity' && parsed.rowSelector && parsed.rowSelector !== 'body') {
        try {
          const testRecipe = recipeSchema.parse({
            rowSelector: parsed.rowSelector,
            fields: parsed.fields,
            nextPageSelector: parsed.nextPageSelector,
          });
          const testRun = runRecipe(html, testRecipe, finalUrl);
          if (testRun.rows && testRun.rows.length > 0) {
            rows = testRun.rows;
            nextUrl = testRun.nextUrl;
          }
        } catch {}
      }

      // If rows are still empty, try fallback classes
      if (rows.length === 0 && candidateClasses.length > 0) {
        for (const [candCls] of Object.entries(tagCounts).slice(0, 5)) {
          try {
            const testRecipe = recipeSchema.parse({
              rowSelector: `.${candCls}`,
              fields: parsed.fields,
              nextPageSelector: parsed.nextPageSelector,
            });
            const testRun = runRecipe(html, testRecipe, finalUrl);
            if (testRun.rows.length > 0) {
              rows = testRun.rows;
              parsed.rowSelector = `.${candCls}`;
              break;
            }
          } catch {}
        }
      }

      // If still empty, fall back to direct AI extraction
      if (rows.length === 0) {
        rows = await extractWithAIGeneric(html, finalUrl, instruction);
      }

      // Ensure fields exist for recipe output
      if (parsed.fields.length === 0 && rows.length > 0) {
        parsed.fields = Object.keys(rows[0]).map((k) => ({
          name: k,
          selector: '',
          attr: 'text',
        }));
      }

      const recipe = {
        rowSelector: parsed.rowSelector || 'body',
        fields: parsed.fields.length > 0 ? parsed.fields : [{ name: 'Content', selector: '', attr: 'text' }],
        nextPageSelector: parsed.nextPageSelector || '',
      };

      return {
        recipe,
        previewRows: rows.slice(0, 15),
        totalDetected: rows.length,
        nextUrl,
        explanation: `Successfully extracted ${rows.length} ${parsed.mode === 'entity' ? 'record' : 'records'} matching: "${instruction}"`,
      };
    } catch (err) {
      console.warn(`Model ${model} failed for describe: ${err.message}`);
    }
  }

  // Final direct extraction fallback if all models failed recipe generation
  try {
    const directRows = await extractWithAIGeneric(html, finalUrl, instruction);
    if (directRows.length > 0) {
      const fields = Object.keys(directRows[0]).map((k) => ({ name: k, selector: '', attr: 'text' }));
      return {
        recipe: { rowSelector: 'body', fields, nextPageSelector: '' },
        previewRows: directRows.slice(0, 15),
        totalDetected: directRows.length,
        nextUrl: '',
        explanation: `Directly extracted ${directRows.length} records matching: "${instruction}"`,
      };
    }
  } catch {}

  throw new Error('Could not extract data from the page with the provided instruction. Please check if the URL is accessible.');
}

/**
 * Background Job Runner
 */
export async function processScrapeJob(jobId) {
  const job = await ScrapeJob.findById(jobId);
  if (!job || job.status === 'cancelled') return;

  job.status = 'running';
  job.startedAt = new Date();
  await job.save();

  try {
    const tasks = await ScrapeTask.find({ job: jobId, status: { $in: ['pending', 'error'] } });
    const blacklist = await Blacklist.find({ workspace: job.workspace }).lean();
    const blacklistedDomains = new Set(blacklist.map((b) => b.domain.toLowerCase()));

    // Auto-compile recipe from instruction if needed
    if (job.instruction && !job.recipe && tasks.length > 0) {
      try {
        const descResult = await describeWithAI({
          url: tasks[0].url,
          instruction: job.instruction,
          columnNames: [],
        });
        if (descResult.recipe) {
          job.recipe = descResult.recipe;
          await job.save();
        }
      } catch (err) {
        console.warn('Could not auto-compile recipe from instruction:', err.message);
      }
    }

    // Create a new Dataset in Data Cleaning to hold results
    let dataset = null;
    if (job.dataset) {
      dataset = await Dataset.findById(job.dataset);
    }

    if (!dataset) {
      let defaultColumns = [];
      if ((job.inputType === 'any_url' || job.instruction) && job.recipe?.fields) {
        defaultColumns = job.recipe.fields.map((f, i) => ({
          id: `col_${i}_${f.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: f.name,
          type: 'text',
          order: i,
          hidden: false,
        }));
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

    const insertedRows = [];
    let currentRowIdx = 0;
    const rowIdxCounter = { value: 0 }; // thread-safe counter for parallel tasks

    // Process tasks: 3 parallel workers, polite per-task handling
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

          try {
            if ((job.inputType === 'any_url' || job.instruction) && (job.recipe || job.instruction)) {
              // Any URL Recipe / Instruction Mode
              const { html, finalUrl } = await safeFetchHtml(task.url);
              task.pagesVisited = [finalUrl];
              let rows = [];

              // Try recipe first if valid selector
              if (job.recipe && job.recipe.rowSelector && job.recipe.rowSelector !== 'body') {
                try {
                  const res = runRecipe(html, job.recipe, finalUrl);
                  rows = res.rows || [];
                } catch {}
              }

              // Fallback to Universal AI extraction if 0 rows (e.g. across different websites)
              if (rows.length === 0 && job.instruction) {
                try {
                  rows = await extractWithAIGeneric(html, finalUrl, job.instruction);
                } catch {}
              }

              if (rows.length > 0) {
                task.status = 'ok';
                task.extractedData = { count: rows.length, sample: rows[0] };

                // Dynamically ensure dataset columns contain all extracted field names
                if (dataset) {
                  const existingColNames = new Set(dataset.columns.map((c) => c.name.toLowerCase()));
                  const sampleRow = rows[0];
                  let colAdded = false;
                  Object.keys(sampleRow).forEach((k) => {
                    if (!existingColNames.has(k.toLowerCase()) && k !== '_id' && k !== 'dataset') {
                      dataset.columns.push({
                        id: `col_${dataset.columns.length}_${k.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                        name: k,
                        type: 'text',
                        order: dataset.columns.length,
                        hidden: false,
                      });
                      existingColNames.add(k.toLowerCase());
                      colAdded = true;
                    }
                  });
                  if (colAdded) {
                    await dataset.save();
                  }
                }

                rows.forEach((r) => {
                  const cells = {};
                  Object.keys(r).forEach((k) => {
                    cells[k] = r[k] !== undefined && r[k] !== null ? String(r[k]) : '';
                  });
                  dataset.columns.forEach((c) => {
                    if (cells[c.id] === undefined) {
                      cells[c.id] = r[c.name] !== undefined ? String(r[c.name]) : r[c.id] !== undefined ? String(r[c.id]) : '';
                    }
                  });
                  insertedRows.push({
                    dataset: dataset._id,
                    index: rowIdxCounter.value++,
                    cells,
                    original: { ...cells },
                    isDeleted: false,
                  });
                });
                job.counts.ok += 1;
              } else {
                task.status = 'no_contact';
                job.counts.ok += 1;
              }
            } else {
              // Prospect Scraper Mode
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

              // Build row for Dataset
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

              insertedRows.push({
                dataset: dataset._id,
                index: rowIdxCounter.value++,
                cells,
                original: { ...cells },
                isDeleted: false,
              });

              // If enriching existing prospects, update prospect directly
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
          } catch (taskErr) {
            if (taskErr.code === 'ROBOTS_BLOCKED') {
              task.status = 'blocked';
              task.error = 'Blocked by robots.txt';
              job.counts.blocked += 1;
            } else if (taskErr.name === 'TimeoutError' || taskErr.message.includes('timeout')) {
              task.status = 'timeout';
              task.error = 'Request timed out after 15s';
              job.counts.failed += 1;
            } else {
              task.status = 'error';
              task.error = taskErr.message || 'Scrape failed';
              job.counts.failed += 1;
            }
          } finally {
            task.resultRowIndex = rowIdxCounter.value;
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

    // Insert dataset rows in batch
    if (insertedRows.length > 0) {
      await DatasetRow.insertMany(insertedRows, { ordered: false });
      dataset.rowCount = insertedRows.length;
      dataset.steps[0].rowsAffected = insertedRows.length;
      await dataset.save();
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
