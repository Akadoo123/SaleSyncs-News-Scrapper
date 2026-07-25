import type { RawItem } from '../../src/types.js';

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600 * 1000).toISOString();

/**
 * ชุดข่าวจำลองสำหรับทดสอบและ Preview (บริบท SaleSync — B2B2C AI CRM)
 * ครอบคลุม: positive 3, neutral 3, negative 3, ข่าวซ้ำ 2,
 * ไทย/อังกฤษ, กฎเกณฑ์ข้อมูล/AI ที่มีผลสองทาง, และ False Positive (Monday/Wise)
 */
export const MOCK_NEWS: RawItem[] = [
  /* ---------- POSITIVE ---------- */
  {
    title: 'องค์กรไทยแห่ลงทุน AI CRM รับกระแส Agentic AI ในงานขาย',
    link: 'https://example-tech.co.th/thai-firms-invest-ai-crm?utm_source=rss',
    snippet:
      'ธุรกิจไทยจำนวนมากเร่งลงทุนระบบ CRM ที่ขับเคลื่อนด้วยปัญญาประดิษฐ์ เพื่อเพิ่มยอดขายและลดการสูญเสียลูกค้า ตลาดซอฟต์แวร์การขายเติบโตต่อเนื่อง โดยกระแส Agentic AI และระบบอัตโนมัติในงานขายได้รับการยอมรับมากขึ้นในกลุ่มองค์กรที่ขายผ่านพาร์ทเนอร์',
    publishedAt: hoursAgo(6),
    sourceId: 'blognone',
    sourceName: 'Blognone',
    sourceTier: 2,
    sourceCountry: 'TH',
    language: 'th',
    unverified: false,
  },
  {
    title: 'depa หนุน SME ไทยเปลี่ยนผ่านดิจิทัล อัดงบสนับสนุนซอฟต์แวร์ธุรกิจ',
    link: 'https://example-gov.go.th/depa-sme-digital-support',
    snippet:
      'สำนักงานส่งเสริมเศรษฐกิจดิจิทัล (depa) เปิดโครงการสนับสนุน SME ไทยเปลี่ยนผ่านดิจิทัล ด้วยเงินอุดหนุนค่าซอฟต์แวร์และระบบบริหารลูกค้า มุ่งยกระดับขีดความสามารถของผู้ประกอบการรายย่อยผ่านเทคโนโลยีและการขายที่ขับเคลื่อนด้วยข้อมูล',
    publishedAt: hoursAgo(10),
    sourceId: 'techsauce',
    sourceName: 'Techsauce',
    sourceTier: 2,
    sourceCountry: 'TH',
    language: 'th',
    unverified: false,
  },
  {
    title: 'Southeast Asia B2B SaaS market to grow 22% as SMEs adopt sales software',
    link: 'https://example-intl.com/sea-b2b-saas-growth',
    snippet:
      'The B2B SaaS market across Southeast Asia is projected to expand by twenty-two percent this year, driven by small and medium enterprises adopting CRM and sales software to improve customer retention and reduce churn across partner-driven distribution channels.',
    publishedAt: hoursAgo(20),
    sourceId: 'e27',
    sourceName: 'e27',
    sourceTier: 2,
    sourceCountry: 'SG',
    language: 'en',
    unverified: false,
  },

  /* ---------- NEUTRAL ---------- */
  {
    title: 'ยอดใช้จ่ายไอทีองค์กรทรงตัว รอประเมินทิศทางการลงทุนเทคโนโลยี',
    link: 'https://example-tech.co.th/it-spending-flat',
    snippet:
      'รายงานล่าสุดระบุงบไอทีขององค์กรไทยทรงตัวใกล้เคียงกับปีก่อน โดยผู้บริหารส่วนใหญ่ยังรอประเมินทิศทางการลงทุนเทคโนโลยีและซอฟต์แวร์ธุรกิจ ท่ามกลางความไม่แน่นอนของภาวะเศรษฐกิจโดยรวม',
    publishedAt: hoursAgo(14),
    sourceId: 'prachachat',
    sourceName: 'ประชาชาติธุรกิจ',
    sourceTier: 2,
    sourceCountry: 'TH',
    language: 'th',
    unverified: false,
  },
  {
    title: 'Singapore consults on enterprise software procurement standards',
    link: 'https://example-intl.com/singapore-software-procurement',
    snippet:
      'Authorities in Singapore have opened a consultation on updating enterprise software procurement standards for the public sector. The review covers cloud vendor evaluation and data handling practices, with no decision expected before the next fiscal year.',
    publishedAt: hoursAgo(26),
    sourceId: 'google-news:en-SG',
    sourceName: 'Business Times',
    sourceTier: 2,
    sourceCountry: 'SG',
    language: 'en',
    unverified: false,
  },
  {
    title: 'รีวิวจากผู้ใช้: เลือก CRM ตัวไหนดีสำหรับทีมขายขนาดเล็ก',
    link: 'https://example-social.com/crm-for-small-sales-team-thread',
    snippet:
      'สมาชิกเว็บบอร์ดแชร์ประสบการณ์การเลือกใช้ระบบ CRM สำหรับทีมขายขนาดเล็ก ทั้งเรื่องราคา ความง่ายในการใช้งาน และการจัดการลูกค้า ยังไม่มีข้อสรุปที่ชัดเจนและเป็นความเห็นส่วนบุคคล',
    publishedAt: hoursAgo(8),
    sourceId: 'pantip',
    sourceName: 'Pantip — ห้องเทคโนโลยี',
    sourceTier: 3,
    sourceCountry: 'TH',
    language: 'th',
    unverified: true,
  },

  /* ---------- NEGATIVE ---------- */
  {
    title: 'Close CRM บุกตลาดไทย ลดราคา 40% พร้อมแจก Free tier ชิงลูกค้า SME จากคู่แข่ง',
    link: 'https://example-tech.co.th/close-crm-price-cut',
    snippet:
      'ผู้ให้บริการ Close CRM ประกาศรุกตลาดซอฟต์แวร์การขายในไทย ด้วยแคมเปญลดราคา 40% และเปิด Free tier เพื่อชิงลูกค้ากลุ่ม SME จากคู่แข่งในตลาด CRM หวังเร่งขยายฐานผู้ใช้ในภูมิภาค',
    publishedAt: hoursAgo(5),
    sourceId: 'prachachat',
    sourceName: 'ประชาชาติธุรกิจ',
    sourceTier: 2,
    sourceCountry: 'TH',
    language: 'th',
    unverified: false,
  },
  {
    title: 'เศรษฐกิจชะลอ องค์กรตัดงบไอที ชะลอลงทุนซอฟต์แวร์ใหม่',
    link: 'https://example-tech.co.th/it-budget-cut',
    snippet:
      'ภาวะเศรษฐกิจที่ชะลอตัวทำให้หลายองค์กรตัดงบไอทีและชะลอการลงทุนในซอฟต์แวร์ธุรกิจใหม่ ส่งผลให้ผู้ให้บริการ SaaS ต้องเผชิญวงจรการขายที่ยาวขึ้นและแรงกดดันด้านราคามากขึ้น',
    publishedAt: hoursAgo(12),
    sourceId: 'bangkokpost-business',
    sourceName: 'Bangkok Post — Business',
    sourceTier: 2,
    sourceCountry: 'TH',
    language: 'th',
    unverified: false,
  },
  {
    title: 'Salesforce launches new AI CRM for SMEs, undercutting regional rivals on price',
    link: 'https://example-intl.com/salesforce-ai-crm-sme',
    snippet:
      'Salesforce has launched a new AI-powered CRM aimed at small and medium enterprises, priced aggressively to undercut regional sales software vendors. Analysts say the move intensifies competition for smaller SaaS players targeting the same customer segment.',
    publishedAt: hoursAgo(30),
    sourceId: 'techcrunch',
    sourceName: 'TechCrunch',
    sourceTier: 2,
    sourceCountry: 'GLOBAL',
    language: 'en',
    unverified: false,
  },

  /* ---------- กฎเกณฑ์ข้อมูล/AI: ผลกระทบสองทาง (บวก=จุดขาย compliance / ลบ=ต้นทุน) ---------- */
  {
    title: 'PDPA คุมเข้มการใช้ข้อมูลลูกค้ากับ AI องค์กรต้องยกระดับ compliance',
    link: 'https://example-tech.co.th/pdpa-ai-customer-data',
    snippet:
      'หน่วยงานกำกับดูแลออกแนวปฏิบัติที่เข้มงวดขึ้นเกี่ยวกับการนำข้อมูลลูกค้ามาใช้กับระบบปัญญาประดิษฐ์ ภายใต้ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) องค์กรที่ใช้ซอฟต์แวร์ CRM และ AI จึงต้องยกระดับมาตรฐาน compliance และธรรมาภิบาลข้อมูล',
    publishedAt: hoursAgo(9),
    sourceId: 'blognone',
    sourceName: 'Blognone',
    sourceTier: 2,
    sourceCountry: 'TH',
    language: 'th',
    unverified: false,
  },

  /* ---------- FALSE POSITIVE: ไม่มีบริบทเทคโนโลยี ---------- */
  {
    title: 'Monday Night Football breaks viewership records this season',
    link: 'https://example-sports.com/monday-night-football-record',
    snippet:
      'Monday Night Football drew record viewership this season, with millions tuning in for the primetime broadcast. Advertisers are celebrating the return of live sports as a reliable audience draw.',
    publishedAt: hoursAgo(4),
    sourceId: 'google-news:en-US',
    sourceName: 'Sports Daily',
    sourceTier: 2,
    sourceCountry: 'GLOBAL',
    language: 'en',
    unverified: false,
  },
  {
    title: 'Wise ประกาศค่าธรรมเนียมโอนเงินระหว่างประเทศแบบใหม่',
    link: 'https://example-fintech.com/wise-transfer-fees',
    snippet:
      'ผู้ให้บริการโอนเงินระหว่างประเทศ Wise ประกาศโครงสร้างค่าธรรมเนียมใหม่สำหรับการโอนเงินและแลกเงิน โดยมีผลกับลูกค้ารายย่อยตั้งแต่เดือนหน้าเป็นต้นไป',
    publishedAt: hoursAgo(7),
    sourceId: 'google-news:th-TH',
    sourceName: 'Fintech News',
    sourceTier: 2,
    sourceCountry: 'TH',
    language: 'th',
    unverified: false,
  },

  /* ---------- ข่าวซ้ำ 2 รายการ (เหตุการณ์เดียวกัน คนละสำนักข่าว/คนละ URL) ---------- */
  {
    title: 'องค์กรไทยแห่ลงทุน AI CRM รับกระแส Agentic AI ในงานขาย',
    link: 'https://example-tech.co.th/thai-firms-invest-ai-crm?fbclid=abc123',
    snippet:
      'ธุรกิจไทยจำนวนมากเร่งลงทุนระบบ CRM ที่ขับเคลื่อนด้วยปัญญาประดิษฐ์ เพื่อเพิ่มยอดขายและลดการสูญเสียลูกค้า ตลาดซอฟต์แวร์การขายเติบโตต่อเนื่อง โดยกระแส Agentic AI และระบบอัตโนมัติในงานขายได้รับการยอมรับมากขึ้นในกลุ่มองค์กรที่ขายผ่านพาร์ทเนอร์',
    publishedAt: hoursAgo(6),
    sourceId: 'google-news:th-TH',
    sourceName: 'Blognone',
    sourceTier: 2,
    sourceCountry: 'TH',
    language: 'th',
    unverified: false,
  },
  {
    title: 'องค์กรไทยเร่งลงทุน AI CRM รับกระแส Agentic AI ในงานขาย',
    link: 'https://another-outlet.co.th/thai-business-ai-crm-adoption',
    snippet:
      'ธุรกิจไทยจำนวนมากเดินหน้าลงทุนระบบ CRM ที่ขับเคลื่อนด้วยปัญญาประดิษฐ์ เพื่อเพิ่มยอดขายและลดการสูญเสียลูกค้า ตลาดซอฟต์แวร์การขายเติบโตต่อเนื่อง โดยกระแส Agentic AI และระบบอัตโนมัติในงานขายได้รับการยอมรับมากขึ้น',
    publishedAt: hoursAgo(5),
    sourceId: 'techsauce',
    sourceName: 'Techsauce',
    sourceTier: 2,
    sourceCountry: 'TH',
    language: 'th',
    unverified: false,
  },
];
