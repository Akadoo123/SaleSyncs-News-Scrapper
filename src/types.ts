import { z } from 'zod';

/* ============================================================
 * Enumerations
 * ========================================================== */

export const Classification = z.enum(['positive', 'neutral', 'negative']);
export type Classification = z.infer<typeof Classification>;

/**
 * SaleSync revenue engines (แทนช่องทาง OEM/B2B/B2C ของ Air4):
 *   INTERNAL   = พิสูจน์ผลใน Air4 (Phase 1 pilot — รายได้หลักตอนนี้)
 *   SAAS       = ขาย vertical SaaS แบบ subscription ให้ลูกค้าภายนอก (Phase 3)
 *   WHITELABEL = Enterprise white-label (120K–300K บาท/เดือน)
 */
export const Channel = z.enum(['INTERNAL', 'SAAS', 'WHITELABEL']);
export type Channel = z.infer<typeof Channel>;

/**
 * เสาหลักของผลิตภัณฑ์ SaleSync (แทน AC_CLEANING/POWER_FLOW/TRADING):
 *   CRM_CORE  = แพลตฟอร์ม Customer 360 / CRM
 *   AI_ENGINE = ชั้น AI พยากรณ์ (Partner Health, Reorder Prediction, Next Best Action)
 *   INCENTIVE = Frontline Incentive Tracking
 */
export const ProductId = z.enum(['CRM_CORE', 'AI_ENGINE', 'INCENTIVE']);
export type ProductId = z.infer<typeof ProductId>;

export const NewsCategory = z.enum([
  'AI_TECH',          // AI / GenAI / LLM / automation
  'SAAS_CLOUD',       // SaaS / cloud / business model
  'CRM_SALESTECH',    // CRM / sales-tech / martech (ตลาดหลัก)
  'DATA_REGULATION',  // PDPA / AI Act / data privacy / นโยบายดิจิทัลภาครัฐ (ผลกระทบสองทาง)
  'COMPETITOR',
  'PLATFORM',         // ความเคลื่อนไหวของแพลตฟอร์มใหญ่ (Salesforce/Microsoft/Google/OpenAI ฯลฯ)
  'THAI_DIGITAL',     // เศรษฐกิจดิจิทัลไทย / SME / โครงการรัฐ (NIA, depa, BOI)
  'FUNDING_MACRO',    // การระดมทุน VC / งบ IT / เศรษฐกิจมหภาค
  'INTERNATIONAL',
  'OTHER',
]);
export type NewsCategory = z.infer<typeof NewsCategory>;

export const TimeHorizon = z.enum(['immediate', '1-3 months', '3-12 months', 'long-term']);
export type TimeHorizon = z.infer<typeof TimeHorizon>;

export const Priority = z.enum(['high', 'medium', 'low']);
export const Deadline = z.enum(['today', 'within_7_days', 'monitor']);

export const OkrDirection = z.enum(['positive', 'neutral', 'negative']);

export const Department = z.enum([
  'Product & Engineering',
  'AI & Data Science',
  'Sales & GTM',
  'Marketing & Growth',
  'Customer Success',
  'Partnerships & BD',
  'Compliance & Security',
  'Finance',
  'Founder & Strategy',
]);
export type Department = z.infer<typeof Department>;

/* ============================================================
 * Raw / normalized article (pre-AI)
 * ========================================================== */

export const ItemKind = z.enum(['news', 'social', 'signal']);
export type ItemKind = z.infer<typeof ItemKind>;

export const RawItemSchema = z.object({
  title: z.string(),
  link: z.string(),
  snippet: z.string().default(''),
  publishedAt: z.string().nullable(),
  sourceId: z.string(),
  sourceName: z.string(),
  sourceTier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  sourceCountry: z.string(),
  language: z.string(),
  unverified: z.boolean().default(false),
  /** news = ข่าว | social = โซเชียล (ยังไม่ยืนยัน) | signal = สัญญาณอุปสงค์ที่ระบบสังเคราะห์ */
  itemKind: ItemKind.default('news'),
});
/** Input type: fields with defaults (snippet, unverified, itemKind) are optional for collectors. */
export type RawItem = z.input<typeof RawItemSchema>;

export const NormalizedItemSchema = RawItemSchema.extend({
  id: z.string(),
  canonicalUrl: z.string(),
  contentHash: z.string(),
  collectedAt: z.string(),
  publishedAt: z.string().nullable(),
  isPressRelease: z.boolean().default(false),
  isSponsored: z.boolean().default(false),
  /** Rule-based prefilter output */
  prefilterScore: z.number().default(0),
  matchedCategories: z.array(NewsCategory).default([]),
  matchedCompetitors: z.array(z.string()).default([]),
  matchedBrands: z.array(z.string()).default([]),
  hasAutomotiveContext: z.boolean().default(false),
  duplicateGroupId: z.string().optional(),
  relatedCoverage: z
    .array(z.object({ sourceName: z.string(), url: z.string(), tier: z.number() }))
    .default([]),
});
export type NormalizedItem = z.infer<typeof NormalizedItemSchema>;

/* ============================================================
 * AI structured output — per-article analysis
 * ========================================================== */

export const RecommendedActionSchema = z.object({
  action: z.string().min(1),
  owner: Department,
  priority: Priority,
  deadline: Deadline,
});
export type RecommendedAction = z.infer<typeof RecommendedActionSchema>;

export const AnalysisSchema = z.object({
  titleTh: z.string().min(1),
  shortSummaryTh: z.string().min(1),
  classification: Classification,
  impactScore: z.number().min(-5).max(5),
  confidence: z.number().min(0).max(100),
  relevanceScore: z.number().min(0).max(100),
  newsCategory: NewsCategory,
  affectedChannels: z.array(Channel).default([]),
  affectedProducts: z.array(ProductId).default([]),
  affectedCountries: z.array(z.string()).default([]),
  affectedCompetitors: z.array(z.string()).default([]),
  okrImpact: z.object({
    O1: OkrDirection,
    O2: OkrDirection,
  }),
  positiveImpacts: z.array(z.string()).max(5).default([]),
  negativeImpacts: z.array(z.string()).max(5).default([]),
  reasoningSummary: z.array(z.string()).max(3).default([]),
  businessInterpretation: z.string().default(''),
  recommendedActions: z.array(RecommendedActionSchema).max(4).default([]),
  timeHorizon: TimeHorizon,
});
export type Analysis = z.infer<typeof AnalysisSchema>;

/** Final persisted record = normalized item + analysis + provenance */
export const AnalyzedItemSchema = NormalizedItemSchema.extend(AnalysisSchema.shape).extend({
  analyzedBy: z.enum(['ai', 'fallback']),
  analysisModel: z.string().optional(),
  sourceUrl: z.string(),
  titleOriginal: z.string(),
  originalSnippet: z.string(),
});
export type AnalyzedItem = z.infer<typeof AnalyzedItemSchema>;

/* ============================================================
 * Daily executive analysis
 * ========================================================== */

export const SignalSchema = z.object({
  title: z.string(),
  detail: z.string(),
  relatedNewsIds: z.array(z.string()).default([]),
});

export const DailyActionSchema = RecommendedActionSchema.extend({
  reason: z.string().default(''),
  relatedNewsIds: z.array(z.string()).default([]),
});

export const DailyAnalysisSchema = z.object({
  executiveSummaryTh: z.string().min(1),
  overallSentiment: Classification,
  netImpactScore: z.number(),
  urgencyLevel: z.enum(['low', 'medium', 'high']),
  opportunitySignals: z.array(SignalSchema).max(5).default([]),
  riskSignals: z.array(SignalSchema).max(5).default([]),
  actionsToday: z.array(DailyActionSchema).max(5).default([]),
  actionsWithin7Days: z.array(DailyActionSchema).max(5).default([]),
  actionsToMonitor: z.array(DailyActionSchema).max(5).default([]),
  okrAssessment: z.object({
    O1: z.string(),
    O2: z.string(),
    benefitingChannels: z.array(z.string()).default([]),
    atRiskChannels: z.array(z.string()).default([]),
    prioritisationNote: z.string().default(''),
  }),
  ceoQuestions: z.array(z.string()).max(3).default([]),
});
export type DailyAnalysis = z.infer<typeof DailyAnalysisSchema>;

/* ============================================================
 * Run report / health
 * ========================================================== */

export const SourceHealthSchema = z.object({
  sourceId: z.string(),
  sourceName: z.string(),
  ok: z.boolean(),
  itemCount: z.number(),
  durationMs: z.number(),
  error: z.string().optional(),
  /**
   * false = ยังไม่ได้ตั้งค่า (เช่น ขาด token) ซึ่งเป็นเรื่องปกติ ไม่ใช่ความล้มเหลว
   * ไม่ระบุ/true = แหล่งที่ตั้งค่าแล้ว (ok หรือ failed จริง)
   */
  configured: z.boolean().optional(),
});
export type SourceHealth = z.infer<typeof SourceHealthSchema>;

export const KpiSchema = z.object({
  totalCollected: z.number(),
  afterDedup: z.number(),
  afterPrefilter: z.number(),
  published: z.number(),
  positive: z.number(),
  neutral: z.number(),
  negative: z.number(),
  highImpact: z.number(),
  competitorAlerts: z.number(),
  evRelated: z.number(),
  international: z.number(),
  oemOpportunities: z.number(),
  b2bOpportunities: z.number(),
  b2cOpportunities: z.number(),
  o1Supporting: z.number(),
  o2Supporting: z.number(),
  socialMentions: z.number().default(0),
  demandSignals: z.number().default(0),
});
export type Kpi = z.infer<typeof KpiSchema>;

export const DailyReportSchema = z.object({
  date: z.string(),
  generatedAt: z.string(),
  timezone: z.string(),
  status: z.enum(['ok', 'degraded', 'failed']),
  kpi: KpiSchema,
  daily: DailyAnalysisSchema,
  items: z.array(AnalyzedItemSchema),
  sourceHealth: z.array(SourceHealthSchema),
  errors: z.array(z.string()).default([]),
  ai: z.object({
    enabled: z.boolean(),
    model: z.string().nullable(),
    itemsAnalyzedByAi: z.number(),
    itemsAnalyzedByFallback: z.number(),
    inputTokens: z.number(),
    outputTokens: z.number(),
    estimatedCostUsd: z.number(),
  }),
});
export type DailyReport = z.infer<typeof DailyReportSchema>;
