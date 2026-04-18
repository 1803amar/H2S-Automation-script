const { test, expect } = require('@playwright/test');
const fs   = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// ============================================================
//  CONFIG — sirf yahan change karo
// ============================================================
const BASE_URL       = 'https://hack2skill.com';
const SCREENSHOT_DIR = path.join(__dirname, '..', 'test-results', 'route-screenshots');
const REPORT_DIR     = path.join(__dirname, '..', 'test-results', 'route-report');

// ── Title mein ye words aaye to FAIL (case-insensitive) ──────
const BAD_TITLE_KEYWORDS = [
  '404',
  'not found',
  'error',
  'page not found',
  'oops',
  'something went wrong',
];
// ============================================================

const ROUTES = [
  '/',
  '/brand-guidelines',
  '/career',
  '/cis',
  '/codeforfuture',
  '/collegehackathon',
  '/collegehackathon/success',
  '/contact-us',
  '/corporatehackathon',
  '/corporatehackathon/success',
  '/dishathon',
  '/ev-hackathon',
  '/event/ai-for-bharat',
  '/fellows',
  '/genai_hackathon_apac_edition_ads1',
  '/genai_hackathon_apac_edition_ads2',
  '/google-cloud-tech-camp',
  '/hack/aceit-nft',
  '/hack/aceitrpa',
  '/hack/aurpa',
  '/hack/bcerpa',
  '/hack/bfbahmedabadmeetup',
  '/hack/bfbbangalore',
  '/hack/bfbbangaloremeetup',
  '/hack/bfbdehradunmeetup',
  '/hack/bfbhyderabadmeetup',
  '/hack/bfbjaipurmeetup',
  '/hack/bfbkolhapurmeetup',
  '/hack/bfbkolkatameetup',
  '/hack/bfblucknowmeetup',
  '/hack/bfbmumbaimeetup',
  '/hack/bfbnagpurmeetup',
  '/hack/bfbpunemeetup',
  '/hack/bfbvadodarameetup',
  '/hack/bitrpa',
  '/hack/buildforbharatmeetup',
  '/hack/ccerpa',
  '/hack/codeathon',
  '/hack/ctrpa',
  '/hack/delhivery-genaihackathon',
  '/hack/dsalearnathon2022',
  '/hack/dtdl-hackfest5',
  '/hack/e2open-hackathon2023',
  '/hack/electhon2023',
  '/hack/encrypt2022',
  '/hack/gen-ai-rush-buildathon',
  '/hack/genai_hackathon_apac_edition',
  '/hack/genai_leadership_roundtable',
  '/hack/gitsrpa',
  '/hack/globalfintechfest-hackathon',
  '/hack/globallogic30hacks',
  '/hack/google-maps-platform-hackathon',
  '/hack/googlecloud-tc-ace-b2',
  '/hack/googlecloud-tc-ace1',
  '/hack/googlecloud-tc-cctur',
  '/hack/googlecloud-tc-cdl-b2',
  '/hack/googlecloud-tc-cdl-b2-ss',
  '/hack/googlecloud-tc-cdl-dgi',
  '/hack/googlecloud-tc-cdl-svpc-raipur',
  '/hack/googlecloud-tc-cdl1',
  '/hack/googlecloud-tc-cfct',
  '/hack/googlecloud-tc-dgi',
  '/hack/googlecloud-tc-g2',
  '/hack/googlecloud-tc-g3',
  '/hack/googlecloud-tc-g4',
  '/hack/googlecloud-tc-g5',
  '/hack/googlecloud-tc-gitj',
  '/hack/googlecloud-tc-gnit',
  '/hack/googlecloud-tc-gspecial',
  '/hack/googlecloud-tc-gsrm',
  '/hack/googlecloud-tc-gtbit',
  '/hack/googlecloud-tc-gurutbit',
  '/hack/googlecloud-tc-gzscc',
  '/hack/googlecloud-tc-jiot',
  '/hack/googlecloud-tc-jit',
  '/hack/googlecloud-tc-jmit',
  '/hack/googlecloud-tc-nsce',
  '/hack/googlecloud-tc-stjce',
  '/hack/googlecloud-tc-stvpce',
  '/hack/googlecloud-tc-tib',
  '/hack/googlecloud-tc-uceou',
  '/hack/googlecloud-tc-vvce',
  '/hack/gvmitmrpa',
  '/hack/gvmitmrpa/terms',
  '/hack/h2s-vision-panel',
  '/hack/h2scr',
  '/hack/h2stc-blockchain',
  '/hack/h2stc-rpadc',
  '/hack/hack4change2024',
  '/hack/health-a-thondatathon',
  '/hack/healthathondatathon',
  '/hack/hih2024',
  '/hack/hsncb-reinventing',
  '/hack/htgpi',
  '/hack/humanaize-education',
  '/hack/humanaize-fintech',
  '/hack/icc-nextin2-mumbai-meetup',
  '/hack/icc-nextin2-sanfrancisco-meetup',
  '/hack/icc-nextin2-singapore-meetup',
  '/hack/icc-nextin2-singapore-meetup_',
  '/hack/icc-nium-nextin',
  '/hack/ideafind',
  '/hack/ideathon2020',
  '/hack/idtcar',
  '/hack/idtcrpa',
  '/hack/iiitsrpa',
  '/hack/iisf-hackathon-2023',
  '/hack/iitmrpa',
  '/hack/infoedge-ventures-ai-hackathon-2024',
  '/hack/informatica-deh-2024',
  '/hack/innovate-mobility',
  '/hack/inqthub',
  '/hack/instinct',
  '/hack/instinct-hackathon',
  '/hack/instinct2022',
  '/hack/instinct2023',
  '/hack/intel-oneapi-2023',
  '/hack/isl-cu-hackathon',
  '/hack/isrohackathon2024',
  '/hack/jecrcrpa',
  '/hack/jlurpa',
  '/hack/jmitrpa',
  '/hack/karnataka-police',
  '/hack/kietrpadc',
  '/hack/kluberhack-2023-24',
  '/hack/kspdatathon2024',
  '/hack/lumos',
  '/hack/maitrpa',
  '/hack/mitrpa',
  '/hack/murpa',
  '/hack/nabard-2024',
  '/hack/nabard-naf-hackathon',
  '/hack/nabard-nai-hackathon',
  '/hack/narra8ive-escape-velocity1',
  '/hack/nasaspaceappsnoida24',
  '/hack/nextin-2.0',
  '/hack/nitjrpa',
  '/hack/nitsrpa',
  '/hack/ntpchackathon',
  '/hack/nylens',
  '/hack/nylw',
  '/hack/ocerpa',
  '/hack/octoberhacx',
  '/hack/ondc-hackathon',
  '/hack/oneapi-genai-hackathon',
  '/hack/onehack',
  '/hack/pbrvitshack',
  '/hack/pescerpa',
  '/hack/pitch-to-sbi',
  '/hack/pitch-to-sbi-sp',
  '/hack/police-hackathon-karnataka',
  '/hack/policehackathon-karnataka',
  '/hack/psnarpa',
  '/hack/rpabootcamp',
  '/hack/rpadc',
  '/hack/rpadc-april',
  '/hack/scale91-hack-ffi2024',
  '/hack/sds-codefest2023',
  '/hack/sds-codetocreate',
  '/hack/sebi-empowering-investors-hackathon',
  '/hack/si-instinct2023',
  '/hack/sisl-ar-club',
  '/hack/sistecrpa',
  '/hack/siterpa',
  '/hack/siwdl-aceit',
  '/hack/siwdl-girls',
  '/hack/siwdl-gvmitm',
  '/hack/siwdl-igdtuw',
  '/hack/siwdl-iiser%20bhopal',
  '/hack/siwdl-jgcoe',
  '/hack/siwdl-jgec',
  '/hack/siwdl-jmit',
  '/hack/siwdl-kietw',
  '/hack/siwdl-niti',
  '/hack/siwdl-nitr',
  '/hack/siwdl-piet',
  '/hack/siwdl-psna',
  '/hack/siwdl-spmvv',
  '/hack/siwdl-srcasw',
  '/hack/siwdl-sswce',
  '/hack/siwdl-sv',
  '/hack/siwdl-toce',
  '/hack/siwdl-toec',
  '/hack/siwdl-vceow',
  '/hack/siwdl-vcew',
  '/hack/siwdl-vignan',
  '/hack/siwdl-vit-ap',
  '/hack/snapchat',
  '/hack/snapin-summer-lensathon-2023',
  '/hack/space-hackathon',
  '/hack/spaceapps-noida',
  '/hack/sparkarlabs',
  '/hack/ss2',
  '/hack/ssfeb',
  '/hack/ssjan',
  '/hack/substrate-polkadot',
  '/hack/surpa',
  '/hack/symphony',
  '/hack/technonjrrpa',
  '/hack/tpf-buildathon',
  '/hack/uliphackathon',
  '/hack/umitrpa',
  '/hack/unlokc2022',
  '/hack/unlokc22',
  '/hack/www.linkedin.com/in/sophieopdenkamp',
  '/hackathon/cloudtitans',
  '/hackathon/covid19',
  '/hackathon/datathon',
  '/hackathon/dishathon2020',
  '/hackathon/idtcopen',
  '/hackathon/iisjaipur',
  '/hackathon/iispatiala',
  '/hackathon/libathon',
  '/hackathon/rtu',
  '/hackathon/star',
  '/hackathon/womensafety',
  '/hackdetails',
  '/humanaize-hackathon',
  '/ideathon',
  '/indiahackathonseries/punehackathon',
  '/innovatetoinspire',
  '/innovationseries',
  '/innovationseries/ms',
  '/inspirehackathon',
  '/intel-oneapi-hackathon-2023',
  '/media-hackathon',
  '/mobilitydevcamp',
  '/mshack',
  '/nextin2-participation',
  '/onboarding',
  '/onboarding/success',
  '/organizeHack',
  '/our-clientele',
  '/programmersdate',
  '/rpa-developer-camp',
  '/single-blog.html',
  '/snapchat-new-year-lensathon',
  '/snapin-iwd2022',
  '/snapin-iwd2022/bootcamps',
  '/snapin-iwd2022/top100',
  '/uprise',
  '/vistara',
  '/vistara/faqs.html',
];

// ── helpers ───────────────────────────────────────────────────
function routeToFilename(route) {
  return (
    route
      .replace(/^\//, '')
      .replace(/\//g, '__')
      .replace(/[%\s]/g, '_')
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_') || 'HOME'
  );
}

function checkTitle(title) {
  if (!title || title.trim() === '') {
    return { ok: false, reason: 'Title is empty — Expected: non-empty title | Got: (empty)' };
  }
  const lower = title.toLowerCase();
  for (const kw of BAD_TITLE_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        ok: false,
        reason: `Title contains bad keyword "${kw}" — Expected: valid page title | Got: "${title}"`,
      };
    }
  }
  return { ok: true, reason: null };
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── shared accumulator ────────────────────────────────────────
const reportData = [];

// ── setup ─────────────────────────────────────────────────────
test.beforeAll(() => {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  fs.mkdirSync(REPORT_DIR,     { recursive: true });
});

// ── one test per route ────────────────────────────────────────
for (const route of ROUTES) {
  test(`[Route] ${route}`, async ({ page }) => {
    const url      = BASE_URL + route;
    const filename = routeToFilename(route) + '.png';
    const filepath = path.join(SCREENSHOT_DIR, filename);

    // 1. Navigate & capture HTTP status
    let httpStatus = null;
    page.on('response', (res) => {
      if (res.url() === url || res.url() === url + '/') {
        httpStatus = res.status();
      }
    });

    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    if (!httpStatus && response) httpStatus = response.status();

    // 2. Page title
    const pageTitle  = await page.title();
    const titleCheck = checkTitle(pageTitle);

    // 3. Screenshot
    await page.screenshot({ path: filepath, fullPage: true });

    // 4. Build result
    const statusOk  = httpStatus === 200;
    const titleOk   = titleCheck.ok;
    const overallOk = statusOk && titleOk;

    const failReasons = [];
    if (!statusOk)  failReasons.push(`HTTP  → Expected: 200 | Got: ${httpStatus}`);
    if (!titleOk)   failReasons.push(`Title → ${titleCheck.reason}`);

    reportData.push({ route, url, filename, httpStatus, statusOk, pageTitle, titleOk, overallOk, failReasons });

    // 5. Assertions — strict 200 only
    expect(
      httpStatus,
      `HTTP check failed → Expected: 200 | Got: ${httpStatus}`
    ).toBe(200);

    expect(
      titleCheck.ok,
      `Title check failed → ${titleCheck.reason}`
    ).toBe(true);
  });
}

// ── afterAll: HTML + JSON + Excel ─────────────────────────────
test.afterAll(() => {
  if (reportData.length === 0) return;

  const total      = reportData.length;
  const passCount  = reportData.filter(r => r.overallOk).length;
  const failCount  = total - passCount;
  const httpFail   = reportData.filter(r => !r.statusOk).length;
  const titleFail  = reportData.filter(r => !r.titleOk).length;
  const bothFail   = reportData.filter(r => !r.statusOk && !r.titleOk).length;
  const now        = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // ── JSON ──────────────────────────────────────────────────
  fs.writeFileSync(
    path.join(REPORT_DIR, 'report.json'),
    JSON.stringify({ base_url: BASE_URL, total, passCount, failCount, results: reportData }, null, 2)
  );

  // ── EXCEL ─────────────────────────────────────────────────
  try {
    const wb = XLSX.utils.book_new();

    // Sheet 1 — Summary
    const wsSummary = XLSX.utils.aoa_to_sheet([
      ['Route Test Summary'],
      [],
      ['Base URL',          BASE_URL],
      ['Run Date',          now],
      [],
      ['Total Routes',      total],
      ['✅ Pass',           passCount],
      ['❌ Fail',           failCount],
      ['Pass Rate',         `${((passCount / total) * 100).toFixed(1)}%`],
      [],
      ['--- Fail Breakdown ---'],
      ['HTTP Status Fail (not 200)',  httpFail],
      ['Page Title Fail',             titleFail],
      ['Both HTTP + Title Fail',      bothFail],
    ]);
    wsSummary['!cols'] = [{ wch: 28 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Sheet 2 — All Routes
    const allRows = [['#', 'Result', 'Route', 'Full URL', 'HTTP Status', 'HTTP Check', 'Page Title', 'Title Check', 'Fail Reason(s)']];
    reportData.forEach((r, i) => {
      allRows.push([
        i + 1,
        r.overallOk ? '✅ PASS' : '❌ FAIL',
        r.route,
        r.url,
        r.httpStatus,
        r.statusOk ? '✅ PASS — 200' : `❌ FAIL — Expected: 200 | Got: ${r.httpStatus}`,
        r.pageTitle || '(empty)',
        r.titleOk  ? '✅ PASS' : `❌ FAIL`,
        r.failReasons.join(' | ') || '—',
      ]);
    });
    const wsAll = XLSX.utils.aoa_to_sheet(allRows);
    wsAll['!cols'] = [{ wch:4 },{ wch:10 },{ wch:45 },{ wch:58 },{ wch:10 },{ wch:34 },{ wch:52 },{ wch:10 },{ wch:72 }];
    XLSX.utils.book_append_sheet(wb, wsAll, 'All Routes');

    // Sheet 3 — Pass Routes
    const passRows = [['#', 'Route', 'Full URL', 'HTTP Status', 'Page Title']];
    reportData.filter(r => r.overallOk).forEach((r, i) => {
      passRows.push([i + 1, r.route, r.url, r.httpStatus, r.pageTitle]);
    });
    const wsPass = XLSX.utils.aoa_to_sheet(passRows);
    wsPass['!cols'] = [{ wch:4 },{ wch:45 },{ wch:58 },{ wch:10 },{ wch:52 }];
    XLSX.utils.book_append_sheet(wb, wsPass, '✅ Pass Routes');

    // Sheet 4 — Fail Routes
    const failRows = [['#', 'Route', 'Full URL', 'HTTP Status', 'HTTP Check', 'Page Title', 'Title Check', 'Fail Reason(s)']];
    reportData.filter(r => !r.overallOk).forEach((r, i) => {
      failRows.push([
        i + 1,
        r.route,
        r.url,
        r.httpStatus,
        r.statusOk ? '✅ PASS — 200' : `❌ FAIL — Expected: 200 | Got: ${r.httpStatus}`,
        r.pageTitle || '(empty)',
        r.titleOk  ? '✅ PASS' : `❌ FAIL`,
        r.failReasons.join(' | '),
      ]);
    });
    const wsFail = XLSX.utils.aoa_to_sheet(failRows);
    wsFail['!cols'] = [{ wch:4 },{ wch:45 },{ wch:58 },{ wch:10 },{ wch:34 },{ wch:52 },{ wch:10 },{ wch:72 }];
    XLSX.utils.book_append_sheet(wb, wsFail, '❌ Fail Routes');

    XLSX.writeFile(wb, path.join(REPORT_DIR, 'route-report.xlsx'));
    console.log(`📗 Excel → ${REPORT_DIR}/route-report.xlsx`);
  } catch (e) {
    console.warn('⚠️  Excel skip (run: npm install xlsx):', e.message);
  }

  // ── HTML ──────────────────────────────────────────────────
  const rows = reportData.map((r, i) => {
    const badge  = r.overallOk ? '✅' : '❌';
    const rowBg  = r.overallOk ? '' : 'style="background:#fff5f5"';
    const imgSrc = `../route-screenshots/${r.filename}`;

    const httpCell = r.statusOk
      ? `<span class="ok">200 ✅</span>`
      : `<span class="ng">${r.httpStatus} ❌</span><br>
         <small class="hint">Expected: 200 | Got: ${r.httpStatus}</small>`;

    const titleCell = r.titleOk
      ? `<span class="ok">${escHtml(r.pageTitle)}</span>`
      : `<span class="ng">${escHtml(r.pageTitle || '(empty)')}</span><br>
         <small class="hint">${escHtml(r.failReasons.find(f => f.includes('Title')) || '')}</small>`;

    const reasonsCell = r.failReasons.length
      ? r.failReasons.map(f => `<div class="reason">• ${escHtml(f)}</div>`).join('')
      : '<span class="ok dim">—</span>';

    return `<tr ${rowBg}>
      <td class="ctr muted">${i + 1}</td>
      <td class="ctr big">${badge}</td>
      <td><code>${escHtml(r.route)}</code></td>
      <td>${httpCell}</td>
      <td class="title-cell">${titleCell}</td>
      <td class="reason-cell">${reasonsCell}</td>
      <td><a href="${imgSrc}" target="_blank">
        <img src="${imgSrc}" class="thumb" onerror="this.style.display='none'"/>
      </a></td>
    </tr>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Route Report — ${BASE_URL}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;background:#f1f5f9;padding:24px;font-size:13px}
  h1{color:#0f172a;font-size:20px;margin-bottom:4px}
  .sub{color:#64748b;font-size:12px;margin-bottom:20px}
  /* cards */
  .cards{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
  .card{background:#fff;border-radius:10px;padding:12px 22px;box-shadow:0 2px 8px rgba(0,0,0,.08);text-align:center;min-width:110px}
  .card .num{font-size:30px;font-weight:700}
  .card .lbl{font-size:10px;color:#64748b;margin-top:2px;text-transform:uppercase;letter-spacing:.5px}
  .c-tot .num{color:#334155} .c-pass .num{color:#16a34a} .c-fail .num{color:#dc2626}
  .c-http .num{color:#f59e0b} .c-ttl .num{color:#8b5cf6}
  /* controls */
  .ctrl{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px}
  .ctrl button{padding:6px 14px;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700}
  .b-all{background:#334155;color:#fff} .b-pass{background:#16a34a;color:#fff} .b-fail{background:#dc2626;color:#fff}
  .ctrl input{padding:6px 11px;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;width:250px}
  /* table */
  .wrap{background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden}
  table{width:100%;border-collapse:collapse}
  thead tr{background:#1e293b;color:#fff}
  th{padding:9px 11px;text-align:left;font-size:12px;white-space:nowrap}
  td{padding:7px 11px;border-bottom:1px solid #f1f5f9;vertical-align:middle}
  tbody tr:hover td{background:#f8fafc}
  code{background:#f1f5f9;padding:2px 4px;border-radius:3px;font-size:11px}
  .ok{color:#16a34a;font-weight:600} .ng{color:#dc2626;font-weight:600}
  .hint{color:#94a3b8;font-size:10px} .dim{font-weight:normal}
  .reason{color:#dc2626;font-size:11px;line-height:1.5}
  .reason-cell{max-width:220px} .title-cell{max-width:260px}
  .ctr{text-align:center} .muted{color:#94a3b8} .big{font-size:17px}
  .thumb{height:68px;border:1px solid #e2e8f0;border-radius:4px;cursor:zoom-in}
</style>
</head>
<body>
  <h1>📸 Route Screenshot Report</h1>
  <p class="sub">Base URL: <strong>${BASE_URL}</strong> &nbsp;|&nbsp; Generated: <strong>${now}</strong></p>

  <div class="cards">
    <div class="card c-tot" ><div class="num">${total}</div><div class="lbl">Total</div></div>
    <div class="card c-pass"><div class="num">${passCount}</div><div class="lbl">✅ Pass</div></div>
    <div class="card c-fail"><div class="num">${failCount}</div><div class="lbl">❌ Fail</div></div>
    <div class="card c-http"><div class="num">${httpFail}</div><div class="lbl">HTTP Fail</div></div>
    <div class="card c-ttl" ><div class="num">${titleFail}</div><div class="lbl">Title Fail</div></div>
  </div>

  <div class="ctrl">
    <button class="b-all"  onclick="flt('all')">All (${total})</button>
    <button class="b-pass" onclick="flt('pass')">✅ Pass (${passCount})</button>
    <button class="b-fail" onclick="flt('fail')">❌ Fail (${failCount})</button>
    <input type="search" id="q" placeholder="Search route or title…" oninput="flt(cur)"/>
  </div>

  <div class="wrap">
    <table>
      <thead><tr>
        <th style="width:38px">#</th>
        <th style="width:48px">Result</th>
        <th>Route</th>
        <th style="width:115px">HTTP Status</th>
        <th>Page Title</th>
        <th>Fail Reason(s)</th>
        <th style="width:95px">Screenshot</th>
      </tr></thead>
      <tbody id="tb">${rows}</tbody>
    </table>
  </div>

  <script>
    let cur='all';
    const R=Array.from(document.querySelectorAll('#tb tr'));
    function flt(t){
      cur=t;
      const q=document.getElementById('q').value.toLowerCase();
      R.forEach(r=>{
        const pass=r.querySelector('td:nth-child(2)').textContent.includes('✅');
        const ok=(t==='all')||(t==='pass'&&pass)||(t==='fail'&&!pass);
        r.style.display=(ok&&(!q||r.textContent.toLowerCase().includes(q)))?'':'none';
      });
    }
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(REPORT_DIR, 'index.html'), html);

  console.log('\n' + '═'.repeat(62));
  console.log(`✅  Pass        : ${passCount}`);
  console.log(`❌  Fail        : ${failCount}`);
  console.log(`   ↳ HTTP fail  : ${httpFail}   (not 200)`);
  console.log(`   ↳ Title fail : ${titleFail}   (empty / 404 / error)`);
  console.log(`📁  Screenshots : test-results/route-screenshots/`);
  console.log(`📊  HTML Report : test-results/route-report/index.html`);
  console.log(`📗  Excel Sheet : test-results/route-report/route-report.xlsx`);
  console.log('═'.repeat(62) + '\n');
});