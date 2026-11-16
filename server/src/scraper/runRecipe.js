import * as cheerio from 'cheerio';

export function runRecipe(html, recipe, baseUrl) {
  try {
    const $ = cheerio.load(html);
    const rows = [];

    $(recipe.rowSelector).each((_, el) => {
      const row = {};
      for (const field of recipe.fields) {
        const node = field.selector ? $(el).find(field.selector).first() : $(el);
        let value = '';
        if (!field.attr || field.attr === 'text') {
          value = node.text().replace(/\s+/g, ' ').trim();
        } else {
          value = node.attr(field.attr) || '';
          if (value && (field.attr === 'href' || field.attr === 'src')) {
            try {
              value = new URL(value, baseUrl).href;
            } catch {
              value = '';
            }
          }
        }
        row[field.name] = value;
      }
      if (Object.values(row).some(Boolean)) rows.push(row);
    });

    let nextUrl = null;
    if (recipe.nextPageSelector) {
      const href = $(recipe.nextPageSelector).first().attr('href');
      if (href) {
        try {
          nextUrl = new URL(href, baseUrl).href;
        } catch {
          nextUrl = null;
        }
      }
    }

    return { rows, nextUrl };
  } catch (err) {
    throw new Error(`Failed to execute recipe: ${err.message}`);
  }
}
