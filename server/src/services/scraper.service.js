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
 * Safe fetch with SSRF check, robots check, timeout, browser UA fallback, and size limits
 */
export async function safeFetchHtml(inputUrl, { ignoreRobots = false } = {}) {
  const safeUrl = await assertSafeUrl(inputUrl);
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

  // Buffer up to 2MB limit
  const buffer = await res.arrayBuffer();
  if (buffer.byteLength > 2 * 1024 * 1024) {
    throw new Error('Page size exceeded 2MB limit');
  }

  const html = new TextDecoder().decode(buffer);
  return { html, finalUrl: res.url };
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

  const maxPages = Math.min(options.maxPagesPerSite || 5, 5);
  const allEmails = [...homeResult.emails];

  // Extra subpages to check
  const subpagesToVisit = [];
  const origin = new URL(homeResult.url).origin;

  if (homeResult.contactPageUrl && homeResult.contactPageUrl !== homeResult.url) {
    subpagesToVisit.push(homeResult.contactPageUrl);
  } else {
    subpagesToVisit.push(`${origin}/contact`);
    subpagesToVisit.push(`${origin}/about`);
  }

  if (homeResult.guestPostPageUrl && homeResult.guestPostPageUrl !== homeResult.url) {
    subpagesToVisit.push(homeResult.guestPostPageUrl);
  } else {
    subpagesToVisit.push(`${origin}/write-for-us`);
  }

  // Visit extra pages up to maxPages limit
  for (const pageUrl of subpagesToVisit) {
    if (pagesVisited.length >= maxPages) break;
    if (pagesVisited.includes(pageUrl)) continue;

    try {
      // 1 sec polite delay between subpages on same origin
      await new Promise((r) => setTimeout(r, 1000));
      const { html, finalUrl } = await safeFetchHtml(pageUrl);
      pagesVisited.push(finalUrl);

      const subData = extractPageData(html, finalUrl);
      subData.emails.forEach((e) => {
        if (!allEmails.some((existing) => existing.email === e.email)) {
          allEmails.push(e);
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
    contactPageUrl: homeResult.contactPageUrl,
    guestPostPageUrl: homeResult.guestPostPageUrl,
    hasGuestPost: homeResult.hasGuestPostPage,
    linkedin: homeResult.socials.linkedin,
    twitter: homeResult.socials.twitter,
    facebook: homeResult.socials.facebook,
    instagram: homeResult.socials.instagram,
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
 * Scrape Any URL: Auto-detect
 */
export async function analyzeAnyUrl(url) {
  const { html, finalUrl } = await safeFetchHtml(url);
  const data = extractPageData(html, finalUrl);

  return {
    url: finalUrl,
    domain: data.domain,
    title: data.title,
    tables: data.tables,
    lists: data.lists,
    links: data.links,
    contacts: {
      emails: data.emails,
      socials: data.socials,
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
 * Scrape Any URL: Describe It (AI Recipe Generation)
 */
export async function describeWithAI({ url, instruction, columnNames = [] }) {
  const { html, finalUrl } = await safeFetchHtml(url, { ignoreRobots: true });
  const $ = cheerio.load(html);

  // Clean HTML to save tokens and avoid prompt injections
  $('script, style, nav, footer, header, svg, noscript, iframe, link, meta').remove();

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

  // Target main content area
  let mainContainer = $('main, article, [role="main"], #content, .content, .main, table, body').first();
  if (!mainContainer.length) mainContainer = $('body');

  const sampleHtml = mainContainer.html()?.slice(0, 32000) || $('body').html()?.slice(0, 32000) || '';

  const client = getAIClient();
  if (!client) {
    throw new Error('Gemini AI client is not configured.');
  }

  const prompt = `You are an expert web scraping recipe generator.
Given this HTML from "${finalUrl}" and the user instruction, propose a clean, robust Cheerio selector recipe to extract the repeated records into table rows.

User Instruction: "${instruction}"
Suggested Columns: ${JSON.stringify(columnNames)}
Detected Candidate Repeated Classes: ${candidateClasses.join(', ') || 'none'}

HTML Sample:
${sampleHtml}

Return JSON matching this exact structure:
{
  "rowSelector": "css selector identifying each repeated item card or table row (e.g. .card, tr.item, .loop-card)",
  "fields": [
    {
      "name": "Column Name",
      "selector": "selector relative to row, or empty if row itself",
      "attr": "text" | "href" | "src"
    }
  ],
  "nextPageSelector": "optional selector for Next pagination link, or empty string if none"
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
      if (Array.isArray(parsed.fields)) {
        parsed.fields.forEach((f) => {
          if (!f.attr || f.attr === null) f.attr = 'text';
        });
      }

      const recipe = recipeSchema.parse(parsed);

      // Execute on the page to produce preview rows
      let { rows, nextUrl } = runRecipe(html, recipe, finalUrl);

      // Self-correcting fallback if rows returned 0
      if (rows.length === 0) {
        console.warn(`Initial selector "${recipe.rowSelector}" returned 0 rows. Attempting fallback matching...`);
        for (const [candCls] of Object.entries(tagCounts).slice(0, 6)) {
          const testRecipe = { ...recipe, rowSelector: `.${candCls}` };
          const testRun = runRecipe(html, testRecipe, finalUrl);
          if (testRun.rows.length > 0) {
            recipe.rowSelector = `.${candCls}`;
            rows = testRun.rows;
            nextUrl = testRun.nextUrl;
            break;
          }
        }
      }

      // If still 0 rows, fallback to AI direct chunk extraction for preview
      if (rows.length === 0) {
        const textSample = $('body').text().replace(/\s+/g, ' ').slice(0, 4000);
        const directPrompt = `Extract up to 10 rows matching the user instruction from this page text:
User instruction: "${instruction}"
Page text:
${textSample}

Return JSON:
{
  "rows": [
    { "field1": "val", "field2": "val" }
  ]
}`;
        try {
          const directRes = await client.models.generateContent({
            model,
            contents: directPrompt,
            config: { responseMimeType: 'application/json' },
          });
          const directParsed = JSON.parse(directRes.text || '{}');
          if (Array.isArray(directParsed.rows) && directParsed.rows.length > 0) {
            rows = directParsed.rows;
          }
        } catch {}
      }

      return {
        recipe,
        previewRows: rows.slice(0, 10),
        totalDetected: rows.length,
        nextUrl,
        explanation: `Successfully extracted ${rows.length} rows using recipe selector "${recipe.rowSelector}"`,
      };
    } catch (err) {
      console.warn(`Model ${model} failed for describe: ${err.message}`);
    }
  }

  throw new Error('Failed to generate recipe from AI description. Please try adjusting your instruction.');
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
          { id: 'col_2_title', name: 'Page Title', type: 'text', order: 2, hidden: false },
          { id: 'col_3_contact_url', name: 'Contact Page', type: 'text', order: 3, hidden: false },
          { id: 'col_4_guest_post', name: 'Write For Us Page', type: 'text', order: 4, hidden: false },
          { id: 'col_5_social_linkedin', name: 'LinkedIn', type: 'text', order: 5, hidden: false },
          { id: 'col_6_author', name: 'Author', type: 'text', order: 6, hidden: false },
          { id: 'col_7_cms', name: 'CMS', type: 'text', order: 7, hidden: false },
          { id: 'col_8_status', name: 'Scrape Status', type: 'text', order: 8, hidden: false },
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
              if (job.recipe) {
                const res = runRecipe(html, job.recipe, finalUrl);
                rows = res.rows || [];
              }

              // Fallback to AI direct extraction if 0 rows and instruction exists
              if (rows.length === 0 && job.instruction) {
                try {
                  const client = getAIClient();
                  if (client) {
                    const $ = cheerio.load(html);
                    $('script, style, nav, footer, header, svg, noscript, iframe').remove();
                    const textSample = $('body').text().replace(/\s+/g, ' ').slice(0, 4000);
                    const prompt = `Extract structured records matching this instruction from the page text.
Instruction: "${job.instruction}"
Page Text: ${textSample}

Return JSON:
{
  "rows": [
    { "field1": "val1", "field2": "val2" }
  ]
}`;
                    const aiRes = await client.models.generateContent({
                      model: CANDIDATE_MODELS[0],
                      contents: prompt,
                      config: { responseMimeType: 'application/json' },
                    });
                    const parsed = JSON.parse(aiRes.text || '{}');
                    if (Array.isArray(parsed.rows)) {
                      rows = parsed.rows;
                    }
                  }
                } catch {}
              }

              if (rows.length > 0) {
                task.status = 'ok';
                task.extractedData = { count: rows.length, sample: rows[0] };
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
                    index: currentRowIdx++,
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
                col_2_title: result.title,
                'Page Title': result.title,
                col_3_contact_url: result.contactPageUrl,
                'Contact Page': result.contactPageUrl,
                col_4_guest_post: result.guestPostPageUrl,
                'Write For Us Page': result.guestPostPageUrl,
                col_5_social_linkedin: result.linkedin,
                LinkedIn: result.linkedin,
                col_6_author: result.author,
                Author: result.author,
                col_7_cms: result.cms,
                CMS: result.cms,
                col_8_status: task.status,
                'Scrape Status': task.status,
              };

              insertedRows.push({
                dataset: dataset._id,
                index: currentRowIdx++,
                cells,
                original: { ...cells },
                isDeleted: false,
              });

              // If enriching existing prospects, update prospect directly
              if (job.inputType === 'prospects' && result.primaryEmail) {
                await Prospect.updateMany(
                  { workspace: job.workspace, domain: result.domain, contactEmail: { $in: ['', null] } },
                  {
                    $set: {
                      contactEmail: result.primaryEmail,
                      emailSourceUrl: result.emailSourceUrl,
                      emailFoundAt: new Date(),
                      status: 'contact_found',
                    },
                  }
                );
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
            task.resultRowIndex = currentRowIdx;
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
