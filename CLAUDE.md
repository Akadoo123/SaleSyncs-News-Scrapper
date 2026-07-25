# CLAUDE.md — คู่มือสำหรับ AI Agent ที่ทำงานกับ Repository นี้

## ระบบนี้คืออะไร

SaleSync Daily AI & SaaS Market Intelligence — ระบบอัตโนมัติที่ดึงข่าวจากแหล่งสาธารณะทุกวัน
คัดกรอง วิเคราะห์ผลกระทบต่อธุรกิจ แล้วสร้าง Executive Dashboard ภาษาไทย
สำหรับ **SaleSync** — B2B2C AI CRM (Revenue OS) ที่พิสูจน์ผลในธุรกิจ Air4 แล้วขยายเป็น vertical SaaS

โฟกัสข่าว: **AI / Generative AI, SaaS / cloud, CRM & sales-tech, กฎเกณฑ์ข้อมูล/AI (PDPA, AI Act),
คู่แข่ง, แพลตฟอร์มใหญ่, เศรษฐกิจดิจิทัลไทย/SME, การระดมทุน** — ทั้งในไทยและต่างประเทศ

> โครงสร้างนี้ clone มาจากระบบ Air4 News Scrap (ข่าวยานยนต์) แล้วดัดแปลงเลเยอร์ธุรกิจ
> **สำคัญ:** ตัวระบุภายในบางตัวคงชื่อเดิมของ Air4 ไว้เพื่อลดการแก้โค้ด แต่ "ความหมาย" เปลี่ยนแล้ว
> (ดูตาราง "การแมปชื่อภายใน" ด้านล่าง) — เวลาอ่านโค้ดอย่าสับสน

## กฎสำคัญที่ห้ามละเมิด

1. **จัดประเภทข่าวตามผลกระทบต่อธุรกิจ ไม่ใช่ตามอารมณ์ของข่าว**
   ข่าวที่เขียนในเชิงบวกอาจเป็นลบต่อ SaleSync และกลับกัน

2. **กฎผลกระทบสองทาง (กฎเกณฑ์ข้อมูล/AI) — ห้ามตัดสินอัตโนมัติ**
   PDPA/AI Act เข้มขึ้น = ลบต่อ (ต้นทุน compliance + ความกังวลใช้ AI กับข้อมูล)
   แต่ = บวกต่อ (SaleSync ที่ compliant + KPI โปร่งใส กลายเป็นจุดขาย และกันคู่แข่งรายเล็ก)
   ต้องประเมินผลกระทบสุทธิเสมอ ถ้าสมดุลให้เป็น `neutral`
   มีเทสต์คุมที่ `tests/analysis.test.ts` → `describe('data/AI regulation dual-impact rule')`
   (โค้ดกฎนี้อยู่ใน `src/analysis/fallback.ts` — คีย์ config ชื่อ `dual_impact`)

3. **False Positive ของชื่อคู่แข่ง**
   `Close`, `Monday`, `Wise` เป็นคำทั่วไป ต้องมีบริบทเทคโนโลยี/CRM ประกอบเสมอ
   มีเทสต์คุมที่ `tests/prefilter.test.ts` และ `tests/separation.test.ts`
   **ห้ามปรับน้ำหนักคะแนนโดยไม่รัน `tests/separation.test.ts`**
   อย่าใส่คำกว้างเกิน (เช่น "ลูกค้า", "ธุรกิจ", "sales") ใน `automotive_context` เพราะจะทำให้ข่าวทั่วไปผ่านประตู

4. **ระบบต้องไม่ล้มทั้งหมดเมื่อบางแหล่งข่าวใช้ไม่ได้**
   ทุก collector ต้อง `try/catch` แล้วบันทึกลง `RunErrors` เสมอ สถานะ `degraded` เป็นเรื่องปกติ

5. **ความปลอดภัยของข้อความจากภายนอก**
   - ทุกข้อความต้องผ่าน `src/security/sanitize.ts` ก่อนเก็บและก่อนแสดง
   - Dashboard สร้าง DOM ด้วย `createElement`/`textContent` เท่านั้น **ห้ามใช้ `innerHTML`**
   - ลิงก์ภายนอกต้องผ่าน `safeLink()` (บังคับ http/https + `noopener noreferrer`)

6. **ห้าม commit secret** — API key อยู่ใน `.env` (ถูก gitignore) หรือ GitHub Secrets เท่านั้น

## การแมปชื่อภายใน (Air4 → SaleSync)

| ตัวระบุในโค้ด (คงเดิม) | ความหมายใน SaleSync |
|---|---|
| `Channel` = INTERNAL / SAAS / WHITELABEL | Air4 pilot / vertical SaaS / enterprise white-label |
| `ProductId` = CRM_CORE / AI_ENGINE / INCENTIVE | แพลตฟอร์ม CRM / ชั้น AI พยากรณ์ / Frontline incentive |
| `NewsCategory` | AI_TECH, SAAS_CLOUD, CRM_SALESTECH, DATA_REGULATION, COMPETITOR, PLATFORM, THAI_DIGITAL, FUNDING_MACRO, INTERNATIONAL, OTHER |
| `automotive_context` (keywords.yaml) / `hasAutomotiveContext` | "บริบทเทคโนโลยี/ซอฟต์แวร์" (ไม่ใช่รถยนต์แล้ว) |
| `require_automotive_context` (competitors.yaml) | บังคับต้องมีบริบทเทคโนโลยี/CRM |
| KPI `evRelated` | จำนวนข่าว AI_TECH |
| KPI `oem/b2b/b2cOpportunities` | โอกาสช่องทาง INTERNAL / SAAS / WHITELABEL |
| กฎ `ev_rule` (business-context.yaml) | กฎผลกระทบสองทางของกฎเกณฑ์ข้อมูล/AI |

## สถาปัตยกรรม (ลำดับการไหลของข้อมูล)

```
collectors/  ดึง RSS/Atom (เทค/ธุรกิจ ไทย+โลก) + Google News + NewsAPI (ถ้ามี key) + Pantip (social)
    ↓
normalizers/ sanitize → canonical URL → content hash → prefilter scoring
    ↓
deduplication/ รวมข่าวซ้ำ 4 สัญญาณ (URL / hash / title / summary + วันที่ใกล้กัน)
    ↓
analysis/prefilter  ประตูคุมต้นทุน AI + กัน False Positive  ← ข่าวที่ต่ำกว่าเกณฑ์ไม่เข้า AI
    ↓
ai/classify     วิเคราะห์รายข่าว (Structured Output + Zod)
ai/dailyAnalysis สรุปภาพรวมรายวัน (adaptive thinking)
    ↓  ถ้าล้มเหลว → analysis/fallback.ts (rule-based, ทำงานได้โดยไม่ต้องมี API key)
storage/store   JSON แยกตามวันที่ + แคชผลวิเคราะห์
    ↓
public/         Dashboard แบบ static (vanilla JS)
```

จุดเข้าหลัก: `src/index.ts` → `runPipeline()`

## คำสั่งที่ใช้บ่อย

```bash
npm test                  # เทสต์ทั้งหมด (155 เทสต์ ต้องผ่าน 100% ก่อน commit)
npm run typecheck         # ตรวจ TypeScript
npm run mock              # รันด้วยข้อมูลจำลอง ไม่แตะเครือข่าย ไม่เสียค่า AI
npm run collect           # ดึงข่าวจริง + ตรวจสุขภาพแหล่งข่าว (ไม่วิเคราะห์)
npm run daily             # รันเต็มระบบ
npm run daily -- --no-ai  # รันเต็มระบบแบบไม่ใช้ AI
npm run serve             # เปิด Dashboard ที่ http://localhost:4173
npx tsx scripts/check-feeds.ts   # ตรวจว่าฟีดไหนตายแล้ว
```

## เมื่อจะแก้ไขสิ่งเหล่านี้ ให้ระวัง

| แก้ไขอะไร | ต้องทำอะไรเพิ่ม |
|---|---|
| น้ำหนักคะแนน/บริบทใน `config/keywords.yaml` | รัน `tests/separation.test.ts` — ต้องยังแยก signal/noise ได้ |
| `automotive_context` (คือ tech context) | อย่าใส่คำกว้าง (ลูกค้า/ธุรกิจ/sales) ไม่งั้น False Positive ผ่าน |
| เกณฑ์ dedup ใน `dedupe.ts` | ค่าปัจจุบันปรับจากการวัดจริง (ข่าวซ้ำ 0.40–0.50, ข่าวต่างกัน ≤0.22) |
| Zod schema/enum ใน `types.ts` | ต้องอัปเดต i18n (`cat.*`/`prod.*`), `kpi.ts`, `fallback.ts`, prompts และ `tests/i18n.test.ts` (groups) ให้ตรงกัน |
| เพิ่มแหล่งข่าว | ตรวจด้วย `check-feeds.ts` ก่อนเสมอ อย่าเดา URL |
| Prompt ใน `prompts/` | ต้องคง JSON schema เดิม ไม่งั้น validation ล้มแล้วตกไป fallback |

## หมายเหตุเฉพาะทาง

- **ภาษาไทยไม่มีช่องว่างระหว่างคำ** — การเทียบคำใช้ `includes()` ไม่ใช่ `\b` (ดู `contains()` ใน `prefilter.ts`)
- **ชื่อแพลตฟอร์มควรมี alias ภาษาไทย** (ไมโครซอฟท์/กูเกิล/เซลส์ฟอร์ซ) เผื่อสื่อไทยเขียนเป็นไทย
- **GitHub Actions ไม่มีคีย์ `timezone`** — cron เป็น UTC เท่านั้น `0 1 * * *` UTC = 08:00 น. ไทย
- **Windows Task Scheduler มีกับดัก 3 อย่าง**
  1. ค่าเริ่มต้น **ห้ามรันบนแบตเตอรี่** → ต้องใส่ `-AllowStartIfOnBatteries -DontStopIfGoingOnBatteries`
  2. พาธโปรเจกต์มีช่องว่าง (`AI Saas News Scrap`) → ใช้ `scripts/run-daily.cmd` ไม่ใช่ `powershell -Command "..."`
  3. ไฟล์ `.ps1` ที่มีภาษาไทยต้องมี UTF-8 BOM (Windows PowerShell 5.1 อ่าน ANSI แล้ว parse error)
  ชื่องาน Task: `SaleSyncDailyIntelligence` — ตรวจด้วย `-Status` และดู `logs/daily.log`
- **Weather collector ถูกปิด** (`sources.yaml → weather.enabled: false`) เพราะไม่เกี่ยวกับ SaaS
  โค้ด `weather.ts` ยังอยู่เพื่อ export type ที่ `config.ts` อ้าง แต่ไม่ทำงานตอน runtime
- **snippet ของ social ต้องเป็นเนื้อหาจริง** ห้ามใส่คำค้นลงไป (prefilter/dedupe จะเพี้ยน — เทสต์คุมที่ `tests/social.test.ts`)
- **ข้อความบน UI ต้องผ่าน `t()` เสมอ** คีย์อยู่ใน `public/assets/i18n.js` ต้องครบทั้ง `th` และ `en`
  (เทสต์ `tests/i18n.test.ts` — global object ยังชื่อ `Air4I18n` ตามโครงเดิม)
- **บทวิเคราะห์เป็นภาษาไทยภาษาเดียว** โหมด EN สลับไปใช้ `titleOriginal` ห้ามแปลฝั่ง client
- Model เริ่มต้น `claude-haiku-4-5` (เลือกเพื่อคุมต้นทุน ~$2-3/เดือน) ใช้ `effort: low`
  สำหรับรายข่าว และ `effort: high` + adaptive thinking สำหรับสรุปรายวัน
  เปลี่ยน model ได้ที่ `AI_MODEL` (env/Secret) หรือแก้ default ใน `config.ts`
  ถ้าใส่ model ใหม่ อย่าลืมเพิ่มราคาใน `PRICING` (`src/ai/provider.ts`) ไม่งั้นจะคิดเป็นราคา opus
