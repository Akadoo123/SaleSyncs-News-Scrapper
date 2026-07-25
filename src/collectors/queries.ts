import { loadKeywords, loadCompetitors, type KeywordsConfig, type CompetitorsConfig } from '../config.js';

export interface SearchQuery {
  q: string;
  categoryId: string;
  language: 'th' | 'en';
}

/**
 * Build the Google News search queries from keywords.yaml.
 * Only terms flagged `query: true` become queries — the rest are scoring signals only.
 */
export function buildKeywordQueries(kw: KeywordsConfig = loadKeywords()): SearchQuery[] {
  const out: SearchQuery[] = [];
  for (const cat of kw.categories) {
    for (const lang of ['th', 'en'] as const) {
      for (const term of cat.terms[lang] ?? []) {
        if (term.query) out.push({ q: term.t, categoryId: cat.id, language: lang });
      }
    }
  }
  return out;
}

/**
 * Competitor queries always carry a tech/CRM qualifier so that ambiguous names
 * ("Close", "Monday", "Wise") cannot match unrelated stories.
 */
export function buildCompetitorQueries(
  comp: CompetitorsConfig = loadCompetitors(),
): SearchQuery[] {
  const qualifiers: Record<'th' | 'en', string[]> = {
    th: ['CRM', 'ซอฟต์แวร์การขาย', 'ระบบขาย'],
    en: ['CRM', 'SaaS', 'sales software'],
  };

  const out: SearchQuery[] = [];
  for (const c of comp.competitors) {
    for (const lang of ['th', 'en'] as const) {
      for (const qual of qualifiers[lang]) {
        out.push({
          q: `"${c.name}" ${qual}`,
          categoryId: 'COMPETITOR',
          language: lang,
        });
      }
    }
  }
  return out;
}

/** Platform/vendor watch-list queries (Salesforce, HubSpot, Microsoft, OpenAI…). */
export function buildBrandQueries(kw: KeywordsConfig = loadKeywords()): SearchQuery[] {
  const out: SearchQuery[] = [];
  for (const brand of kw.brands.priority) {
    out.push({ q: `${brand} CRM`, categoryId: 'PLATFORM', language: 'th' });
    out.push({ q: `${brand} AI CRM`, categoryId: 'PLATFORM', language: 'en' });
  }
  return out;
}

export function buildAllQueries(): SearchQuery[] {
  const seen = new Set<string>();
  const all = [...buildKeywordQueries(), ...buildCompetitorQueries(), ...buildBrandQueries()];
  return all.filter((q) => {
    const key = `${q.language}:${q.q.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Google News RSS search endpoint for one query in one locale. */
export function googleNewsUrl(
  endpoint: string,
  q: string,
  locale: { hl: string; gl: string; ceid: string },
  lookbackHours: number,
): string {
  const days = Math.max(1, Math.ceil(lookbackHours / 24));
  const u = new URL(endpoint);
  u.searchParams.set('q', `${q} when:${days}d`);
  u.searchParams.set('hl', locale.hl);
  u.searchParams.set('gl', locale.gl);
  u.searchParams.set('ceid', locale.ceid);
  return u.toString();
}
