import { loadKeywords } from '../config.js';
import { truncate } from '../security/sanitize.js';
import type {
  Analysis,
  Channel,
  Classification,
  DailyAnalysis,
  NewsCategory,
  NormalizedItem,
  ProductId,
  TimeHorizon,
  AnalyzedItem,
} from '../types.js';

/* ============================================================
 * Rule-based Fallback
 * ใช้เมื่อ: ไม่มี API Key / AI ล้มเหลว / JSON ไม่ผ่าน Validation / เกินงบประมาณ
 * เป้าหมาย: ระบบต้องเดินต่อได้เสมอ ไม่ล้มทั้ง Pipeline
 *
 * บริบท: SaleSync — B2B2C AI CRM (Revenue OS) พิสูจน์ผลใน Air4 แล้วขยายเป็น vertical SaaS
 * จัดประเภทตาม "ผลกระทบต่อธุรกิจ SaleSync" ไม่ใช่ตามน้ำเสียงของข่าว
 * ========================================================== */

const POSITIVE_SIGNALS: Array<{ re: RegExp; weight: number; th: string }> = [
  { re: /เร่งลงทุน|แห่ลงทุน|ลงทุนเพิ่ม|เพิ่มงบ|adopt(ion)?|เติบโต|โต\s*\d|growth|surge|expand|ระดมทุน|funding round|raises?\b/i, weight: 2, th: 'ตลาด SaaS/AI เติบโตหรือมีเงินลงทุนเข้า = อุปสงค์ต่อเครื่องมือเพิ่มขึ้น' },
  { re: /SME.*ดิจิทัล|digital transformation|ดิจิทัลทรานส์ฟอร์ม|เปลี่ยนผ่านดิจิทัล|go digital/i, weight: 3, th: 'กระแส Digital Transformation ของ SME = กลุ่มเป้าหมายหลักของ SaleSync' },
  { re: /partner.*program|ตัวแทนจำหน่าย|distributor|ช่องทางค้าปลีก|B2B2C|dealer network/i, weight: 3, th: 'โมเดล partner-driven ที่ SaleSync แก้ปัญหาโดยตรง (revenue leakage)' },
  { re: /NIA|depa|BOI|ส่งเสริมสตาร์ทอัพ|สนับสนุน SME|grant|เงินอุดหนุน|มาตรการสนับสนุน/i, weight: 2, th: 'นโยบายรัฐหนุนดิจิทัล/สตาร์ทอัพ = โอกาสทุน/ตลาด' },
  { re: /agentic ai|generative ai|เอไอเชิงสร้าง|predictive|พยากรณ์การขาย|next best action|sales intelligence/i, weight: 3, th: 'เทคโนโลยี AI ที่เป็นแกนของ SaleSync ได้รับการยอมรับมากขึ้น' },
  { re: /churn|revenue leakage|dormant|ลูกค้าหลุด|ยอดรีออเดอร์|reorder|retention/i, weight: 2, th: 'ปัญหาที่ SaleSync แก้ (churn/dormant/reorder) เป็นที่พูดถึง = ตอกย้ำ pain point' },
];

const NEGATIVE_SIGNALS: Array<{ re: RegExp; weight: number; th: string }> = [
  { re: /ตัดงบ|ลดงบ|budget cut|ชะลอการลงทุน|ชะลอลงทุน|หดตัว|decline|slump|เลิกจ้าง|layoff|ปลดพนักงาน/i, weight: 2, th: 'งบไอที/เศรษฐกิจหดตัว = ลูกค้าชะลอซื้อ SaaS' },
  { re: /สงครามราคา|ลดราคา|ตัดราคา|price war|free tier|ฟรี|เปิดให้ใช้ฟรี/i, weight: 3, th: 'แรงกดดันด้านราคา/แจกฟรีจากคู่แข่ง กระทบ ARR และมาร์จิ้น' },
  { re: /ค่า cloud เพิ่ม|ขึ้นราคา|cost increase|api price|ต้นทุนเพิ่ม|inflation|ค่าเงิน/i, weight: 2, th: 'ต้นทุน cloud/โมเดล AI เพิ่ม กระทบกำไร' },
  { re: /ข้อมูลรั่ว|data breach|โดนแฮก|ransomware|ปรับ.*PDPA|บทลงโทษ.*ข้อมูล|fine/i, weight: 2, th: 'เหตุข้อมูลรั่ว/บทลงโทษ = ความเสี่ยงด้านความเชื่อมั่นและ compliance' },
  { re: /เข้าซื้อกิจการ|acquire|acquisition|ควบรวม|เปิดตัว.*crm|launch.*crm|new ai crm/i, weight: 2, th: 'คู่แข่ง/แพลตฟอร์มใหญ่ขยับเข้าตลาด CRM/AI โดยตรง' },
];

/**
 * กฎ "ผลกระทบสองทาง" ของ SaleSync (แทนกฎ EV ของ Air4):
 * ข่าวกฎเกณฑ์ข้อมูล/AI ที่เข้มขึ้น (PDPA, AI Act) มีทั้งด้านลบและด้านบวก
 *   ลบ  = ต้นทุน compliance เพิ่ม / ความกังวลในการใช้ AI กับข้อมูลลูกค้า
 *   บวก = SaleSync ที่ชู PDPA-compliant + KPI/Incentive โปร่งใส กลายเป็นจุดขาย
 *          และยกกำแพงกันคู่แข่งรายเล็กที่ทำ compliance ไม่ไหว
 */
const REGULATION_RE = /PDPA|AI Act|GDPR|กฎหมายข้อมูล|คุ้มครองข้อมูล|ความเป็นส่วนตัว|data privacy|กำกับดูแล AI|regulat|compliance|ธรรมาภิบาลข้อมูล|data governance/i;

function detectChannels(text: string, item: NormalizedItem): Channel[] {
  const out = new Set<Channel>();
  if (/Air4|แอร์โฟร์|internal pilot|พิสูจน์ผล|proof of concept|ภายในองค์กร/i.test(text)) out.add('INTERNAL');
  if (/SaaS|subscription|สมัครสมาชิก|SME|vertical|ลูกค้าใหม่|onboard|self-serve/i.test(text)) out.add('SAAS');
  if (/enterprise|white.?label|องค์กรขนาดใหญ่|โซลูชันองค์กร|on-?premise/i.test(text)) out.add('WHITELABEL');
  if (out.size === 0) out.add('SAAS'); // ค่าเริ่มต้น: มองเป็นสัญญาณของตลาด SaaS
  return [...out];
}

function detectProducts(text: string): ProductId[] {
  const out = new Set<ProductId>();
  if (/CRM|customer 360|ฐานข้อมูลลูกค้า|pipeline|จัดการลูกค้า|contact management/i.test(text)) {
    out.add('CRM_CORE');
  }
  if (/AI|เอไอ|predictive|พยากรณ์|machine learning|next best action|health score|scoring|automation/i.test(text)) {
    out.add('AI_ENGINE');
  }
  if (/incentive|คอมมิชชัน|commission|frontline|ทีมขายหน้างาน|reward|จูงใจ/i.test(text)) {
    out.add('INCENTIVE');
  }
  return [...out];
}

function pickCategory(item: NormalizedItem, text: string): NewsCategory {
  if (item.matchedCompetitors.length > 0) return 'COMPETITOR';
  if (REGULATION_RE.test(text)) return 'DATA_REGULATION';
  const order: NewsCategory[] = [
    'CRM_SALESTECH', 'AI_TECH', 'SAAS_CLOUD', 'DATA_REGULATION',
    'PLATFORM', 'THAI_DIGITAL', 'FUNDING_MACRO', 'INTERNATIONAL',
  ];
  for (const c of order) if (item.matchedCategories.includes(c)) return c;
  return item.matchedCategories[0] ?? 'OTHER';
}

/**
 * ให้คะแนนผลกระทบสุทธิแบบ Rule-based
 * กฎกฎเกณฑ์ข้อมูล/AI: มีทั้งผลบวก (จุดขาย compliance) และผลลบ (ต้นทุน) → ต้องหักลบกันก่อน
 */
export function fallbackAnalyze(item: NormalizedItem): Analysis {
  const text = `${item.title} ${item.snippet}`;
  const positives: string[] = [];
  const negatives: string[] = [];
  const reasons: string[] = [];

  let score = 0;

  for (const s of POSITIVE_SIGNALS) {
    if (s.re.test(text)) {
      score += s.weight;
      positives.push(s.th);
    }
  }
  for (const s of NEGATIVE_SIGNALS) {
    if (s.re.test(text)) {
      score -= s.weight;
      negatives.push(s.th);
    }
  }

  // --- คู่แข่ง: ข่าวคู่แข่งเชิงรุกเป็นลบต่อ SaleSync ---
  if (item.matchedCompetitors.length > 0) {
    if (/ปัญหา|ร้องเรียน|ถอน|ยกเลิก|outage|ล่ม|complaint|lawsuit|ข้อมูลรั่ว|data breach/i.test(text)) {
      score += 2;
      positives.push('คู่แข่งมีปัญหา = โอกาสของ SaleSync');
    } else {
      score -= 3;
      negatives.push(`คู่แข่ง (${item.matchedCompetitors.join(', ')}) เคลื่อนไหวในตลาด`);
    }
    reasons.push(`ตรวจพบคู่แข่ง: ${item.matchedCompetitors.join(', ')}`);
  }

  // --- กฎผลกระทบสองทาง (กฎเกณฑ์ข้อมูล/AI): ประเมินทั้งสองด้านแล้วหาผลสุทธิ ---
  const isRegulation = REGULATION_RE.test(text);
  if (isRegulation) {
    score += 2; // บวก: SaleSync ที่ PDPA-compliant + โปร่งใส กลายเป็นจุดขาย และกันคู่แข่งเล็ก
    positives.push('กฎเกณฑ์ข้อมูล/AI ที่เข้มขึ้น = จุดขายของ SaleSync (PDPA-compliant, KPI โปร่งใส) และยกกำแพงกันคู่แข่งรายเล็ก');
    score -= 2; // ลบ: ต้นทุน compliance เพิ่ม + ความกังวลในการใช้ AI กับข้อมูลลูกค้า
    negatives.push('ต้นทุน compliance เพิ่ม และลูกค้าอาจกังวลการใช้ AI กับข้อมูลส่วนบุคคล');
    reasons.push('ข่าวกฎเกณฑ์ข้อมูล/AI: ผลบวก (จุดขาย compliance) หักลบผลลบ (ต้นทุน) → ประเมินผลสุทธิ');
  }

  // --- ปรับด้วยความน่าเชื่อถือของแหล่งข่าว ---
  if (item.sourceTier === 3 || item.unverified) {
    score = Math.trunc(score * 0.6);
    reasons.push('แหล่งข่าว Tier 3 — ข้อมูลยังต้องตรวจสอบ');
  }

  const impactScore = Math.max(-5, Math.min(5, score));
  const classification: Classification =
    impactScore >= 2 ? 'positive' : impactScore <= -2 ? 'negative' : 'neutral';

  // --- Relevance จาก prefilter score ---
  // ปรับเทียบจากคะแนนจริง: pf 0 → 0, pf 8 → 44, pf 14 → 60, pf 26 → 92
  const relevanceScore = item.prefilterScore === 0
    ? 0
    : Math.max(0, Math.min(100, Math.round(12 + item.prefilterScore * 3.1)));

  // --- Confidence: fallback มั่นใจต่ำกว่า AI เสมอ ---
  let confidence = 45;
  if (item.publishedAt) confidence += 8;
  if (item.sourceTier === 1) confidence += 10;
  if (item.sourceTier === 3) confidence -= 12;
  if (item.snippet.length > 120) confidence += 5;
  if (isRegulation) confidence -= 5; // ผลกระทบสองทาง ต้องให้คนตัดสิน
  confidence = Math.max(10, Math.min(75, confidence));

  const channels = detectChannels(text, item);
  const products = detectProducts(text);

  const timeHorizon: TimeHorizon = isRegulation
    ? 'long-term'
    : item.matchedCompetitors.length > 0
      ? 'immediate'
      : '1-3 months';

  const okrDir = classification;

  return {
    titleTh: item.language === 'th' ? item.title : `[EN] ${item.title}`,
    shortSummaryTh: truncate(
      item.snippet || item.title,
      300,
    ) || item.title,
    classification,
    impactScore,
    confidence,
    relevanceScore,
    newsCategory: pickCategory(item, text),
    affectedChannels: channels,
    affectedProducts: products,
    affectedCountries: [item.sourceCountry === 'GLOBAL' ? 'Global' : item.sourceCountry],
    affectedCompetitors: item.matchedCompetitors,
    okrImpact: {
      O1: okrDir,
      O2: channels.includes('SAAS') || channels.includes('WHITELABEL') ? okrDir : 'neutral',
    },
    positiveImpacts: positives.slice(0, 5),
    negativeImpacts: negatives.slice(0, 5),
    reasoningSummary: (reasons.length ? reasons : ['วิเคราะห์ด้วยกฎอัตโนมัติ (ไม่ได้ใช้ AI)']).slice(0, 3),
    businessInterpretation:
      'วิเคราะห์โดยระบบกฎอัตโนมัติ (Rule-based) เนื่องจากไม่สามารถเรียกใช้ AI ได้ — ควรให้ผู้เชี่ยวชาญตรวจสอบก่อนตัดสินใจ',
    recommendedActions: [
      {
        action: 'ตรวจสอบรายละเอียดข่าวต้นฉบับและประเมินผลกระทบเชิงลึก',
        owner: 'Founder & Strategy',
        priority: Math.abs(impactScore) >= 3 ? ('high' as const) : ('medium' as const),
        deadline: Math.abs(impactScore) >= 3 ? ('today' as const) : ('monitor' as const),
      },
    ],
    timeHorizon,
  };
}

/** สรุปภาพรวมรายวันแบบ Rule-based */
export function fallbackDaily(items: AnalyzedItem[]): DailyAnalysis {
  const kw = loadKeywords();
  void kw;

  const pos = items.filter((i) => i.classification === 'positive');
  const neg = items.filter((i) => i.classification === 'negative');
  const neu = items.filter((i) => i.classification === 'neutral');
  const net = items.reduce((s, i) => s + i.impactScore * (i.confidence / 100), 0);

  const topPos = [...pos].sort((a, b) => b.impactScore - a.impactScore).slice(0, 3);
  const topNeg = [...neg].sort((a, b) => a.impactScore - b.impactScore).slice(0, 3);
  const competitorItems = items.filter((i) => i.affectedCompetitors.length > 0);

  const overall: Classification = net >= 3 ? 'positive' : net <= -3 ? 'negative' : 'neutral';

  const summary =
    items.length === 0
      ? 'วันนี้ไม่พบข่าวที่เกี่ยวข้องกับธุรกิจ SaleSync ผ่านเกณฑ์คัดกรอง อาจเป็นวันที่ตลาดเงียบ หรือแหล่งข่าวบางแห่งไม่สามารถเข้าถึงได้ แนะนำให้ตรวจสอบสถานะแหล่งข่าวในส่วน System Status'
      : [
          `วันนี้ระบบคัดกรองข่าวที่เกี่ยวข้องกับ SaleSync ได้ ${items.length} ข่าว`,
          `แบ่งเป็นเชิงบวก ${pos.length} ข่าว เป็นกลาง ${neu.length} ข่าว และเชิงลบ ${neg.length} ข่าว`,
          `คะแนนผลกระทบสุทธิอยู่ที่ ${net.toFixed(1)} ซึ่งจัดอยู่ในระดับ${
            overall === 'positive' ? 'บวก' : overall === 'negative' ? 'ลบ' : 'เป็นกลาง'
          }ต่อธุรกิจ`,
          topPos[0] ? `ข่าวเชิงบวกที่สำคัญที่สุดคือ "${topPos[0].titleTh}"` : '',
          topNeg[0] ? `ข่าวที่ต้องเฝ้าระวังมากที่สุดคือ "${topNeg[0].titleTh}"` : '',
          competitorItems.length
            ? `พบความเคลื่อนไหวของคู่แข่ง ${competitorItems.length} รายการ ควรติดตามใกล้ชิด`
            : 'ยังไม่พบความเคลื่อนไหวสำคัญของคู่แข่งในวันนี้',
          'หมายเหตุ: บทวิเคราะห์นี้สร้างโดยระบบกฎอัตโนมัติเนื่องจากไม่สามารถเรียกใช้ AI ได้',
        ]
          .filter(Boolean)
          .join(' ');

  return {
    executiveSummaryTh: summary,
    overallSentiment: overall,
    netImpactScore: Number(net.toFixed(2)),
    urgencyLevel: Math.abs(net) >= 6 || competitorItems.length >= 3 ? 'high' : Math.abs(net) >= 3 ? 'medium' : 'low',
    opportunitySignals: topPos.map((i) => ({
      title: i.titleTh,
      detail: i.positiveImpacts[0] ?? i.shortSummaryTh,
      relatedNewsIds: [i.id],
    })),
    riskSignals: topNeg.map((i) => ({
      title: i.titleTh,
      detail: i.negativeImpacts[0] ?? i.shortSummaryTh,
      relatedNewsIds: [i.id],
    })),
    actionsToday: topNeg.slice(0, 2).map((i) => ({
      action: `ประเมินผลกระทบจากข่าว: ${i.titleTh}`,
      reason: i.negativeImpacts[0] ?? 'ข่าวเชิงลบที่มีผลกระทบสูง',
      owner: 'Founder & Strategy' as const,
      priority: 'high' as const,
      deadline: 'today' as const,
      relatedNewsIds: [i.id],
    })),
    actionsWithin7Days: topPos.slice(0, 2).map((i) => ({
      action: `ต่อยอดโอกาสจากข่าว: ${i.titleTh}`,
      reason: i.positiveImpacts[0] ?? 'ข่าวเชิงบวกที่สร้างโอกาสทางธุรกิจ',
      owner: 'Sales & GTM' as const,
      priority: 'medium' as const,
      deadline: 'within_7_days' as const,
      relatedNewsIds: [i.id],
    })),
    actionsToMonitor: competitorItems.slice(0, 2).map((i) => ({
      action: `ติดตามความเคลื่อนไหวของ ${i.affectedCompetitors.join(', ')}`,
      reason: 'ความเคลื่อนไหวของคู่แข่งอาจกระทบส่วนแบ่งตลาด',
      owner: 'Partnerships & BD' as const,
      priority: 'medium' as const,
      deadline: 'monitor' as const,
      relatedNewsIds: [i.id],
    })),
    okrAssessment: {
      O1: `สัญญาณวันนี้${overall === 'positive' ? 'สนับสนุน' : overall === 'negative' ? 'กดดัน' : 'ยังไม่ชี้ชัดต่อ'}เป้าหมายพิสูจน์ผลและเพิ่มรายได้ภายใน Air4`,
      O2: `ข่าวที่เกี่ยวกับการขยายเป็น vertical SaaS ภายนอกมี ${
        items.filter((i) => i.affectedChannels.includes('SAAS') || i.affectedChannels.includes('WHITELABEL')).length
      } รายการ`,
      benefitingChannels: [...new Set(pos.flatMap((i) => i.affectedChannels))],
      atRiskChannels: [...new Set(neg.flatMap((i) => i.affectedChannels))],
      prioritisationNote: 'ควรตรวจสอบด้วย AI Analysis เพื่อความแม่นยำ',
    },
    ceoQuestions: [
      'ข่าววันนี้มีรายการใดที่ควรเปลี่ยนลำดับความสำคัญของ roadmap หรือ GTM หรือไม่',
      'มีคู่แข่งหรือแพลตฟอร์มใหญ่รายใดที่กำลังส่งสัญญาณเข้าตลาด CRM/AI ที่ต้องจับตา',
    ],
  };
}
