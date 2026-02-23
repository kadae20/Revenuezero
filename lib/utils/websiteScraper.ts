/**
 * Website Scraper - Single-page scrape for SaaS URL enrichment
 * Extracts: title, headings, hero copy, pricing, CTAs, testimonials
 * Single-page only, no heavy crawling. Timeout & invalid URL fallback.
 */

import * as cheerio from 'cheerio';

const SCRAPE_TIMEOUT_MS = 10000;
const MAX_TEXT_LENGTH = 5000;

export interface ScrapedWebsite {
  title: string;
  h1: string[];
  h2: string[];
  hero_copy: string;
  pricing_section: string;
  cta_buttons: string[];
  testimonials: string[];
  raw_text_sample: string;
  success: boolean;
  error?: string;
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
    .slice(0, MAX_TEXT_LENGTH);
}

export async function scrapeWebsite(url: string): Promise<ScrapedWebsite> {
  const empty: ScrapedWebsite = {
    title: '',
    h1: [],
    h2: [],
    hero_copy: '',
    pricing_section: '',
    cta_buttons: [],
    testimonials: [],
    raw_text_sample: '',
    success: false,
  };

  if (!url || !isValidUrl(url)) {
    return { ...empty, error: 'Invalid URL' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'RevenueZero-Bot/1.0 (Revenue Intelligence)',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return { ...empty, error: `HTTP ${res.status}` };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Title
    const title = $('title').text().trim() || '';

    // Headings
    const h1 = $('h1')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .slice(0, 5);
    const h2 = $('h2')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean)
      .slice(0, 15);

    // Hero - first section/main/hero
    const heroSelectors = [
      '[class*="hero"]',
      '[class*="banner"]',
      'main section:first',
      '.hero',
      '#hero',
      '[data-hero]',
    ];
    let hero_copy = '';
    for (const sel of heroSelectors) {
      const el = $(sel).first();
      if (el.length) {
        hero_copy = el.text().trim();
        if (hero_copy.length > 100) break;
      }
    }
    if (!hero_copy && h1.length) {
      hero_copy = $('h1').first().parent().text().trim();
    }

    // Pricing section
    const pricingSelectors = [
      '[class*="pricing"]',
      '[class*="price"]',
      '[id*="pricing"]',
      '[id*="price"]',
      '[data-pricing]',
    ];
    let pricing_section = '';
    for (const sel of pricingSelectors) {
      const el = $(sel).first();
      if (el.length) {
        pricing_section = el.text().trim();
        if (pricing_section.length > 50) break;
      }
    }

    // CTA buttons
    const ctaSelectors =
      'a[href*="signup"], a[href*="register"], a[href*="start"], a[href*="get-started"], a[href*="trial"], button, [role="button"], [class*="cta"], [class*="btn"]';
    const cta_buttons = $(ctaSelectors)
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => t.length >= 2 && t.length <= 80)
      .slice(0, 10);

    // Testimonials
    const testimonialSelectors = [
      '[class*="testimonial"]',
      '[class*="review"]',
      '[class*="quote"]',
      'blockquote',
      '[data-testimonial]',
    ];
    const testimonials: string[] = [];
    for (const sel of testimonialSelectors) {
      $(sel).each((_, el) => {
        const t = $(el).text().trim();
        if (t.length > 20 && t.length < 500) {
          testimonials.push(t);
        }
      });
      if (testimonials.length >= 3) break;
    }

    const raw_text_sample = cleanText(
      $('body').text().trim().slice(0, 3000)
    );

    return {
      title: cleanText(title),
      h1: h1.map(cleanText),
      h2: h2.map(cleanText),
      hero_copy: cleanText(hero_copy),
      pricing_section: cleanText(pricing_section),
      cta_buttons,
      testimonials: testimonials.slice(0, 5),
      raw_text_sample,
      success: true,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const msg =
      err instanceof Error ? err.message : String(err);
    const isAbort = msg.toLowerCase().includes('abort');
    return {
      ...empty,
      error: isAbort ? 'Timeout' : msg,
    };
  }
}
