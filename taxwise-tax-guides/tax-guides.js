/* ==========================================================================
   TaxWise Uganda — Learning Hub › Tax Guides
   Plain JavaScript, no framework or build step.

   Usage:
     <link rel="stylesheet" href="tax-guides.css">
     <div id="tax-guides"></div>
     <script src="tax-guides.js"></script>
     <script>TaxGuides.mount('#tax-guides');</script>

   Routing is hash-based:
     #/guides        → index of all guides
     #/guides/vat    → a single guide
   To add a guide, add an object to TAX_GUIDES using the same shape as VAT.
   Guides with status "draft" appear on the index as "In review" and are not
   opened, so unverified figures never reach the public site.
   ========================================================================== */

(function () {
  'use strict';

  // ------------------------------------------------------------------------
  // Content
  // ------------------------------------------------------------------------
  const CATEGORIES = [
    'All',
    'Indirect tax',
    'Income tax',
    'Employment',
    'Property',
    'Small business',
  ];

  const TAX_GUIDES = [
    {
      slug: 'vat',
      title: 'Value Added Tax',
      short: 'VAT',
      category: 'Indirect tax',
      status: 'published',
      lastReviewed: '2026-10-30',
      tags: ['vat', 'efris', 'registration', 'threshold', 'input tax', 'output tax'],
      summary:
        'A tax on most goods and services supplied in Uganda, charged by registered businesses and filed monthly with URA.',
      keyFacts: [
        { label: 'Standard rate', value: '18%' },
        { label: 'Registration threshold', value: 'UGX 300m / year' },
        { label: 'Return due', value: '15th of next month' },
        { label: 'Filing', value: 'Monthly · URA e-Services' },
      ],
      sections: {
        whatItIs:
          'VAT is charged on taxable supplies made by taxable persons, on imports of goods (unless exempt), and on imported services received by any person in Uganda.',
        whoApplies: [
          'Registration is compulsory once annual taxable turnover exceeds UGX 300 million, or UGX 75 million in any three consecutive months. This threshold took effect on 1 July 2026; it was previously UGX 150 million.',
          'Businesses below the threshold may apply for voluntary registration, subject to URA approval.',
        ],
        rates: [
          { name: 'Standard', rate: '18%', note: 'Most goods and services.' },
          { name: 'Zero-rated', rate: '0%', note: 'No VAT charged, but input tax is recoverable.' },
          { name: 'Exempt', rate: '—', note: 'No VAT charged and no input tax recovery.' },
        ],
        filing: [
          'File a return every month, by the 15th day of the following month.',
          'Pay any VAT due by the same date, using a PRN generated on URA e-Services.',
          'Issue invoices through EFRIS so that your customers can claim input tax.',
        ],
        example: {
          scenario:
            'In March, a registered business makes sales of UGX 50,000,000 and buys business inputs of UGX 30,000,000 (both VAT-exclusive).',
          lines: [
            { label: 'Output VAT on sales', calc: '50,000,000 × 18%', amount: 9000000 },
            { label: 'Less: input VAT on purchases', calc: '30,000,000 × 18%', amount: -5400000 },
          ],
          total: { label: 'Net VAT payable', amount: 3600000, note: 'Due by 15 April' },
        },
        mistakes: [
          'Applying the old UGX 150m threshold, which many websites still quote.',
          'Claiming input VAT on purchases used to make exempt supplies.',
          'Claiming input VAT on invoices that were not issued through EFRIS.',
          'Forgetting to account for VAT on imported services (reverse charge).',
        ],
        legal: [
          'Value Added Tax Act, Cap. 349',
          'Value Added Tax (Amendment) Act, 2026',
        ],
      },
      cta: {
        label: 'Review a VAT return in Compliance Review',
        href: '/compliance-review?type=vat',
      },
    },

    // ---- Drafts: shown as "In review" until their content is verified ----
    {
      slug: 'rental-income-tax',
      title: 'Rental Income Tax',
      short: 'Rental',
      category: 'Property',
      status: 'draft',
      tags: ['rental', 'landlord', 'property'],
      summary: 'Tax on income earned from renting out land and buildings, for individuals and companies.',
    },
    {
      slug: 'paye',
      title: 'Pay As You Earn',
      short: 'PAYE',
      category: 'Employment',
      status: 'draft',
      tags: ['paye', 'salary', 'employer', 'payroll'],
      summary: 'Income tax that employers deduct from employees’ pay and remit to URA every month.',
    },
    {
      slug: 'corporate-income-tax',
      title: 'Corporate Income Tax',
      short: 'CIT',
      category: 'Income tax',
      status: 'draft',
      tags: ['corporate', 'company', 'cit', 'provisional'],
      summary: 'Tax on the chargeable income of companies, with provisional returns and a final annual return.',
    },
    {
      slug: 'presumptive-tax',
      title: 'Presumptive Tax',
      short: 'Presumptive',
      category: 'Small business',
      status: 'draft',
      tags: ['small business', 'turnover', 'presumptive'],
      summary: 'A simplified turnover-based tax regime for qualifying small businesses.',
    },
    {
      slug: 'withholding-tax',
      title: 'Withholding Tax',
      short: 'WHT',
      category: 'Income tax',
      status: 'draft',
      tags: ['withholding', 'wht', 'suppliers', 'dividends'],
      summary: 'Tax deducted at source on specified payments such as supplies, services, dividends and interest.',
    },
  ];

  // ------------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------------
  const esc = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[c]);

  const fmtDate = (iso) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });

  const fmtUGX = (n) => {
    const abs = Math.abs(n).toLocaleString('en-US');
    return (n < 0 ? '(' : '') + abs + (n < 0 ? ')' : '');
  };

  const findGuide = (slug) => TAX_GUIDES.find((g) => g.slug === slug);

  const state = { query: '', category: 'All' };

  // ------------------------------------------------------------------------
  // Index view
  // ------------------------------------------------------------------------
  function filteredGuides() {
    const q = state.query.trim().toLowerCase();
    return TAX_GUIDES.filter((g) => {
      const inCategory = state.category === 'All' || g.category === state.category;
      if (!inCategory) return false;
      if (!q) return true;
      const haystack = [g.title, g.short, g.summary, g.category, ...(g.tags || [])]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  function cardHTML(g) {
    const isDraft = g.status !== 'published';
    const rate = g.keyFacts && g.keyFacts[0];
    const tag = isDraft ? 'div' : 'a';
    const href = isDraft ? '' : ` href="#/guides/${esc(g.slug)}"`;
    return `
      <${tag} class="tg-card${isDraft ? ' is-draft' : ''}"${href}>
        <div class="tg-card-top">
          <span class="tg-code">${esc(g.short)}</span>
          <span class="tg-pill${isDraft ? ' tg-pill-muted' : ''}">
            ${isDraft ? 'In review' : esc(rate ? rate.value : 'Guide')}
          </span>
        </div>
        <h3 class="tg-card-title">${esc(g.title)}</h3>
        <p class="tg-card-summary">${esc(g.summary)}</p>
        <div class="tg-card-foot">
          <span>${esc(g.category)}</span>
          <span>${isDraft ? 'Coming soon' : 'Reviewed ' + esc(fmtDate(g.lastReviewed))}</span>
        </div>
      </${tag}>`;
  }

  function renderGrid(root) {
    const grid = root.querySelector('.tg-grid');
    const list = filteredGuides();
    grid.innerHTML = list.length
      ? list.map(cardHTML).join('')
      : `<p class="tg-empty">No guides match “${esc(state.query)}”.</p>`;
  }

  function renderIndex(root) {
    const published = TAX_GUIDES.filter((g) => g.status === 'published').length;
    root.innerHTML = `
      <section class="tg-hero">
        <p class="tg-eyebrow">Learning Hub</p>
        <h1 class="tg-h1">Tax Guides</h1>
        <p class="tg-lede">
          Plain-language notes on Uganda’s main taxes: who they apply to, the rates,
          deadlines, worked examples and the mistakes we see most often.
        </p>
        <p class="tg-count">${published} of ${TAX_GUIDES.length} guides published</p>
      </section>

      <div class="tg-toolbar">
        <label class="tg-search">
          <span class="tg-visually-hidden">Search guides</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input type="search" placeholder="Search VAT, PAYE, rental…" value="${esc(state.query)}">
        </label>
        <div class="tg-chips" role="tablist">
          ${CATEGORIES.map(
            (c) => `<button type="button" class="tg-chip${c === state.category ? ' is-active' : ''}"
                      data-cat="${esc(c)}" role="tab" aria-selected="${c === state.category}">${esc(c)}</button>`
          ).join('')}
        </div>
      </div>

      <div class="tg-grid"></div>`;

    renderGrid(root);

    root.querySelector('.tg-search input').addEventListener('input', (e) => {
      state.query = e.target.value;
      renderGrid(root);
    });

    root.querySelectorAll('.tg-chip').forEach((btn) =>
      btn.addEventListener('click', () => {
        state.category = btn.dataset.cat;
        root.querySelectorAll('.tg-chip').forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-selected', active);
        });
        renderGrid(root);
      })
    );
  }

  // ------------------------------------------------------------------------
  // Guide view
  // ------------------------------------------------------------------------
  const SECTION_ORDER = [
    ['what', 'What it is'],
    ['who', 'Who it applies to'],
    ['rates', 'Rates'],
    ['filing', 'Deadlines and filing'],
    ['example', 'Worked example'],
    ['mistakes', 'Common mistakes'],
    ['legal', 'Legal reference'],
  ];

  function guideHTML(g, fromKyt) {
    const s = g.sections;
    const ex = s.example;

    return `
      ${fromKyt ? `
      <button type="button" class="tg-back">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
        Back to your tax results
      </button>` : ''}
      <nav class="tg-crumbs" aria-label="Breadcrumb">
        <a href="#/guides">Learning Hub</a><span>/</span>
        <a href="#/guides">Tax Guides</a><span>/</span>
        <span aria-current="page">${esc(g.short)}</span>
      </nav>

      <header class="tg-guide-head">
        <p class="tg-eyebrow">${esc(g.category)}</p>
        <h1 class="tg-h1">${esc(g.title)} <span class="tg-h1-short">(${esc(g.short)})</span></h1>
        <p class="tg-lede">${esc(g.summary)}</p>
        <dl class="tg-facts">
          ${g.keyFacts.map((f) => `
            <div class="tg-fact"><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}
        </dl>
      </header>

      <div class="tg-layout">
        <aside class="tg-toc" aria-label="On this page">
          <p class="tg-toc-title">On this page</p>
          ${SECTION_ORDER.map(([id, label]) =>
            `<button type="button" data-target="sec-${id}">${esc(label)}</button>`).join('')}
        </aside>

        <article class="tg-body">
          <section id="sec-what">
            <h2>What it is</h2>
            <p>${esc(s.whatItIs)}</p>
          </section>

          <section id="sec-who">
            <h2>Who it applies to</h2>
            ${s.whoApplies.map((p) => `<p>${esc(p)}</p>`).join('')}
          </section>

          <section id="sec-rates">
            <h2>Rates</h2>
            <div class="tg-rates">
              ${s.rates.map((r) => `
                <div class="tg-rate">
                  <span class="tg-rate-value">${esc(r.rate)}</span>
                  <span class="tg-rate-name">${esc(r.name)}</span>
                  <span class="tg-rate-note">${esc(r.note)}</span>
                </div>`).join('')}
            </div>
          </section>

          <section id="sec-filing">
            <h2>Deadlines and filing</h2>
            <ol class="tg-steps">${s.filing.map((f) => `<li>${esc(f)}</li>`).join('')}</ol>
          </section>

          <section id="sec-example">
            <h2>Worked example</h2>
            <p>${esc(ex.scenario)}</p>
            <table class="tg-ledger">
              <thead><tr><th>Item</th><th>Working</th><th class="num">UGX</th></tr></thead>
              <tbody>
                ${ex.lines.map((l) => `
                  <tr><td>${esc(l.label)}</td><td class="mono">${esc(l.calc)}</td>
                      <td class="num">${fmtUGX(l.amount)}</td></tr>`).join('')}
              </tbody>
              <tfoot>
                <tr><td>${esc(ex.total.label)}</td><td class="mono">${esc(ex.total.note)}</td>
                    <td class="num">${fmtUGX(ex.total.amount)}</td></tr>
              </tfoot>
            </table>
          </section>

          <section id="sec-mistakes">
            <h2>Common mistakes</h2>
            <ul class="tg-mistakes">${s.mistakes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>
          </section>

          <section id="sec-legal">
            <h2>Legal reference</h2>
            <ul class="tg-legal">${s.legal.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
          </section>

          <a class="tg-cta" href="${esc(g.cta.href)}">
            <span>${esc(g.cta.label)}</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>

          <footer class="tg-foot">
            <span>Last reviewed: ${esc(fmtDate(g.lastReviewed))} · Source: URA and the Acts listed above</span>
            <span>This guide is general information, not tax advice.</span>
          </footer>
        </article>
      </div>`;
  }

  function renderGuide(root, g) {
    const fromKyt = /[?&]from=kyt\b/.test(location.hash);
    root.innerHTML = guideHTML(g, fromKyt);
    const back = root.querySelector('.tg-back');
    if (back) back.addEventListener('click', () => history.back());
    document.title = `${g.title} (${g.short}) — Tax Guides · TaxWise`;
    root.querySelectorAll('.tg-toc button').forEach((btn) =>
      btn.addEventListener('click', () => {
        const el = document.getElementById(btn.dataset.target);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      })
    );
    window.scrollTo(0, 0);
  }

  function renderNotFound(root) {
    root.innerHTML = `
      <section class="tg-hero">
        <p class="tg-eyebrow">Learning Hub</p>
        <h1 class="tg-h1">Guide not available yet</h1>
        <p class="tg-lede">This guide is still being reviewed. <a href="#/guides">Back to all guides</a></p>
      </section>`;
  }

  // ------------------------------------------------------------------------
  // Know Your Taxes → Tax Guides
  //
  // At the end of the Know Your Taxes questionnaire, call:
  //   TaxGuides.renderGuideLinks('#kyt-guides', ['vat', 'paye', 'rental'], {
  //     baseUrl: '/learning-hub',   // page where TaxGuides.mount() runs
  //   });
  //
  // The array holds the tax IDs your questionnaire already produces. If your
  // IDs differ from the guide slugs, map them in KYT_TO_GUIDE below.
  // ------------------------------------------------------------------------
  const KYT_TO_GUIDE = {
    vat: 'vat',
    rental: 'rental-income-tax',
    paye: 'paye',
    cit: 'corporate-income-tax',
    presumptive: 'presumptive-tax',
    wht: 'withholding-tax',
  };

  function renderGuideLinks(target, taxIds, options = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) throw new Error(`TaxGuides: no element matches "${target}"`);

    const base = options.baseUrl ?? '/learning-hub';
    const seen = new Set();
    const guides = (taxIds || [])
      .map((id) => findGuide(KYT_TO_GUIDE[id] || id))
      .filter((g) => g && !seen.has(g.slug) && seen.add(g.slug));

    if (!guides.length) {
      el.innerHTML = '';
      return;
    }

    el.classList.add('tg-root', 'tg-kyt-root');
    el.innerHTML = `
      <section class="tg-kyt">
        <p class="tg-eyebrow">Next step</p>
        <h2 class="tg-kyt-title">Read up on your taxes</h2>
        <p class="tg-kyt-lede">
          Based on your answers, these taxes apply to you. Each guide covers who it
          applies to, the rates, deadlines and a worked example.
        </p>
        <ul class="tg-kyt-list">
          ${guides.map((g) => {
            const live = g.status === 'published';
            return `
            <li>
              ${live
                ? `<a class="tg-kyt-item" href="${esc(base)}#/guides/${esc(g.slug)}?from=kyt">`
                : `<div class="tg-kyt-item is-draft">`}
                <span class="tg-code">${esc(g.short)}</span>
                <span class="tg-kyt-name">${esc(g.title)}</span>
                <span class="tg-kyt-action">${live ? 'Read guide →' : 'Guide coming soon'}</span>
              ${live ? '</a>' : '</div>'}
            </li>`;
          }).join('')}
        </ul>
        <a class="tg-kyt-all" href="${esc(base)}#/guides">Browse all tax guides</a>
      </section>`;
  }

  // ------------------------------------------------------------------------
  // Router
  // ------------------------------------------------------------------------
  function route(root) {
    const match = location.hash.match(/^#\/guides\/([\w-]+)/);
    if (!match) {
      document.title = 'Tax Guides — Learning Hub · TaxWise';
      return renderIndex(root);
    }
    const guide = findGuide(match[1]);
    if (guide && guide.status === 'published') return renderGuide(root, guide);
    renderNotFound(root);
  }

  function mount(selector) {
    const root = document.querySelector(selector);
    if (!root) throw new Error(`TaxGuides: no element matches "${selector}"`);
    root.classList.add('tg-root');
    window.addEventListener('hashchange', () => route(root));
    route(root);
  }

  window.TaxGuides = { mount, renderGuideLinks, guides: TAX_GUIDES };
})();
