/* ==========================================================================
   TaxWise Uganda — Learning Hub › Tax Guides (renderer)
   Plain JavaScript, no framework or build step.

   Usage (Learning Hub page):
     1. Link tax-guides.css in the head.
     2. Add an empty element:  <div id="tax-guides"></div>
     3. Load tax-guides-data.js, then tax-guides.js.
     4. Call:  TaxGuides.mount('#tax-guides');

   Usage (end of Know Your Taxes):
     TaxGuides.renderGuideLinks('#kyt-guides', ['vat', 'paye'], { baseUrl: '/learning-hub' });

   Routes (hash-based):
     #/guides                  index of all guides
     #/guides/vat              a single guide
     #/guides/vat?from=kyt     same, with a "Back to your tax results" button

   Content lives in tax-guides-data.js. Guides with status "draft" show as
   "In review" and cannot be opened.
   ========================================================================== */

(function () {
  'use strict';

  const DATA = window.TAX_GUIDES_DATA;
  if (!DATA) throw new Error('TaxGuides: load tax-guides-data.js before tax-guides.js');

  const GUIDES = DATA.guides;
  const CATEGORIES = DATA.categories;
  const KYT_MAP = DATA.kytMap || {};

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
    return n < 0 ? `(${abs})` : abs;
  };

  const findGuide = (slug) => GUIDES.find((g) => g.slug === slug);
  const isLive = (g) => g.status === 'published';
  const list = (arr) => (Array.isArray(arr) ? arr : []);

  const ICON_ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  const ICON_BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
  const ICON_SEARCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';

  const state = { query: '', category: 'All' };

  // ------------------------------------------------------------------------
  // Index view
  // ------------------------------------------------------------------------
  function filteredGuides() {
    const q = state.query.trim().toLowerCase();
    return GUIDES.filter((g) => {
      if (state.category !== 'All' && g.category !== state.category) return false;
      if (!q) return true;
      return [g.title, g.short, g.summary, g.category, ...list(g.tags)]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }

  function cardHTML(g) {
    const live = isLive(g);
    const fact = g.keyFacts && g.keyFacts[0];
    const open = live ? `<a class="tg-card" href="#/guides/${esc(g.slug)}">` : '<div class="tg-card is-draft">';
    const close = live ? '</a>' : '</div>';
    return `
      ${open}
        <div class="tg-card-top">
          <span class="tg-code">${esc(g.short)}</span>
          ${live && g.sections && g.sections.changes ? '<span class="tg-pill">Updated 2026</span>' : ''}
          ${!live ? '<span class="tg-pill tg-pill-muted">In review</span>' : ''}
        </div>
        <h3 class="tg-card-title">${esc(g.title)}</h3>
        <p class="tg-card-summary">${esc(g.summary)}</p>
        ${fact ? `<p class="tg-card-fact"><span>${esc(fact.label)}</span><strong>${esc(fact.value)}</strong></p>` : ''}
        <div class="tg-card-foot">
          <span>${esc(g.category)}</span>
          <span>${live ? 'Reviewed ' + esc(fmtDate(g.lastReviewed)) : 'Coming soon'}</span>
        </div>
      ${close}`;
  }

  function renderGrid(root) {
    const grid = root.querySelector('.tg-grid');
    const items = filteredGuides();
    grid.innerHTML = items.length
      ? items.map(cardHTML).join('')
      : `<p class="tg-empty">No guides match “${esc(state.query)}”.</p>`;
  }

  function renderIndex(root) {
    const published = GUIDES.filter(isLive).length;
    root.innerHTML = `
      <section class="tg-hero">
        <p class="tg-eyebrow">Learning Hub</p>
        <h1 class="tg-h1">Tax Guides</h1>
        <p class="tg-lede">
          Practical notes on Uganda’s main taxes: who they apply to, current rates,
          deadlines, worked examples, penalties and the mistakes we see most often.
        </p>
        <p class="tg-count">${published} of ${GUIDES.length} guides published · Rules in force from 1 July 2026</p>
      </section>

      <div class="tg-toolbar">
        <label class="tg-search">
          <span class="tg-visually-hidden">Search guides</span>
          ${ICON_SEARCH}
          <input type="search" placeholder="Search VAT, PAYE, dividends, landlord…" value="${esc(state.query)}">
        </label>
        <div class="tg-chips" role="tablist">
          ${CATEGORIES.map((c) => `
            <button type="button" class="tg-chip${c === state.category ? ' is-active' : ''}"
              data-cat="${esc(c)}" role="tab" aria-selected="${c === state.category}">${esc(c)}</button>`).join('')}
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
          b.classList.toggle('is-active', b === btn);
          b.setAttribute('aria-selected', b === btn);
        });
        renderGrid(root);
      })
    );
  }

  // ------------------------------------------------------------------------
  // Guide view: one builder per section. Each returns '' when there is no
  // content, and the table of contents lists only the sections that render.
  // ------------------------------------------------------------------------
  function tableHTML(t) {
    const twoCol = t.columns.length === 2;
    return `
      ${t.caption ? `<p class="tg-caption">${esc(t.caption)}</p>` : ''}
      <div class="tg-table-wrap">
        <table class="tg-ledger tg-bands">
          <thead><tr>${t.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead>
          <tbody>
            ${t.rows.map((row) => `<tr>${row.map((cell, i) =>
              `<td class="${i === 0 && /^(\d|Up to|Above)/.test(cell) ? 'tg-band' : ''}${!twoCol && i > 0 ? ' tg-center' : ''}">${esc(cell)}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>`;
  }

  function exampleHTML(ex) {
    return `
      <div class="tg-example">
        ${ex.title ? `<h3>${esc(ex.title)}</h3>` : ''}
        <p>${esc(ex.scenario)}</p>
        <div class="tg-table-wrap">
          <table class="tg-ledger">
            <thead><tr><th>Item</th><th class="tg-working">Working</th><th class="num">UGX</th></tr></thead>
            <tbody>
              ${ex.lines.map((l) => `
                <tr><td>${esc(l.label)}</td><td class="mono tg-working">${esc(l.calc)}</td>
                    <td class="num">${fmtUGX(l.amount)}</td></tr>`).join('')}
            </tbody>
            <tfoot>
              <tr><td>${esc(ex.total.label)}<span class="tg-total-note">${esc(ex.total.note)}</span></td>
                  <td class="mono tg-working">${esc(ex.total.note)}</td>
                  <td class="num">${fmtUGX(ex.total.amount)}</td></tr>
            </tfoot>
          </table>
        </div>
      </div>`;
  }

  const SECTIONS = [
    ['what', 'What it is', (s) => (s.whatItIs ? `<p>${esc(s.whatItIs)}</p>` : '')],

    ['changes', 'What changed', (s) => (s.changes ? `
      <div class="tg-changes">
        <p class="tg-changes-title">${esc(s.changes.title)}</p>
        <ul>${list(s.changes.points).map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
      </div>` : '')],

    ['who', 'Who it applies to', (s) => list(s.whoApplies).map((p) => `<p>${esc(p)}</p>`).join('')],

    ['rates', 'Rates', (s) => {
      const tables = s.rateTables || (s.rateTable ? [s.rateTable] : []);
      const cards = list(s.rates).length ? `
        <div class="tg-rates">
          ${s.rates.map((r) => `
            <div class="tg-rate">
              <span class="tg-rate-value">${esc(r.rate)}</span>
              <span class="tg-rate-name">${esc(r.name)}</span>
              <span class="tg-rate-note">${esc(r.note)}</span>
            </div>`).join('')}
        </div>` : '';
      const notes = list(s.rateNotes).map((n) => `<p class="tg-note">${esc(n)}</p>`).join('');
      return cards + tables.map(tableHTML).join('') + notes;
    }],

    ['filing', 'Deadlines and filing', (s) => (list(s.filing).length
      ? `<ol class="tg-steps">${s.filing.map((f) => `<li>${esc(f)}</li>`).join('')}</ol>` : '')],

    ['examples', 'Worked examples', (s) =>
      list(s.examples || (s.example ? [s.example] : [])).map(exampleHTML).join('')],

    ['special', 'Special cases', (s) => (list(s.special).length ? `
      <div class="tg-special">
        ${s.special.map((c) => `
          <div class="tg-special-item"><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p></div>`).join('')}
      </div>` : '')],

    ['penalties', 'Penalties', (s) => (list(s.penalties).length ? `
      <div class="tg-table-wrap">
        <table class="tg-ledger tg-penalties">
          <thead><tr><th>Default</th><th>Penalty</th></tr></thead>
          <tbody>${s.penalties.map((p) => `<tr><td>${esc(p.item)}</td><td>${esc(p.penalty)}</td></tr>`).join('')}</tbody>
        </table>
      </div>` : '')],

    ['mistakes', 'Common mistakes', (s) => (list(s.mistakes).length
      ? `<ul class="tg-mistakes">${s.mistakes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : '')],

    ['faqs', 'FAQs', (s) => (list(s.faqs).length ? `
      <div class="tg-faqs">
        ${s.faqs.map((f) => `
          <details class="tg-faq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}
      </div>` : '')],

    ['legal', 'Legal reference', (s) => (list(s.legal).length
      ? `<ul class="tg-legal">${s.legal.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>` : '')],

    ['sources', 'Sources', (s) => (list(s.sources).length
      ? `<ul class="tg-sources">${s.sources.map((r) =>
          `<li><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.title)}</a></li>`).join('')}</ul>` : '')],
  ];

  function relatedHTML(g) {
    const others = GUIDES.filter((o) => o.slug !== g.slug && isLive(o)).slice(0, 3);
    if (!others.length) return '';
    return `
      <div class="tg-related">
        <p class="tg-toc-title">Other guides</p>
        <div class="tg-related-list">
          ${others.map((o) => `
            <a href="#/guides/${esc(o.slug)}"><span class="tg-code">${esc(o.short)}</span>${esc(o.title)}</a>`).join('')}
        </div>
      </div>`;
  }

  function guideHTML(g, fromKyt) {
    const s = g.sections || {};
    const built = SECTIONS
      .map(([id, label, build]) => ({ id, label, html: build(s) }))
      .filter((sec) => sec.html.trim());

    return `
      ${fromKyt ? `<button type="button" class="tg-back">${ICON_BACK} Back to your tax results</button>` : ''}
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
          ${list(g.keyFacts).map((f) => `
            <div class="tg-fact"><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}
        </dl>
      </header>

      <div class="tg-layout">
        <aside class="tg-toc" aria-label="On this page">
          <p class="tg-toc-title">On this page</p>
          ${built.map((sec) => `<button type="button" data-target="sec-${sec.id}">${esc(sec.label)}</button>`).join('')}
        </aside>

        <article class="tg-body">
          ${built.map((sec) => `
            <section id="sec-${sec.id}">
              ${sec.id === 'changes' ? '' : `<h2>${esc(sec.label)}</h2>`}
              ${sec.html}
            </section>`).join('')}

          ${g.cta ? `<a class="tg-cta" href="${esc(g.cta.href)}"><span>${esc(g.cta.label)}</span>${ICON_ARROW}</a>` : ''}

          ${relatedHTML(g)}

          <footer class="tg-foot">
            <span>Last reviewed: ${esc(fmtDate(g.lastReviewed))} · Rules in force from 1 July 2026</span>
            <span>This guide is general information, not tax advice. Confirm current rules with URA before acting.</span>
          </footer>
        </article>
      </div>`;
  }

  function renderGuide(root, g) {
    const fromKyt = /[?&]from=kyt\b/.test(location.hash);
    root.innerHTML = guideHTML(g, fromKyt);
    document.title = `${g.title} (${g.short}) — Tax Guides · TaxWise`;

    const back = root.querySelector('.tg-back');
    if (back) back.addEventListener('click', () => history.back());

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
  // Know Your Taxes → Tax Guides panel
  // ------------------------------------------------------------------------
  function renderGuideLinks(target, taxIds, options = {}) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) throw new Error(`TaxGuides: no element matches "${target}"`);

    const base = options.baseUrl ?? '/learning-hub';
    const seen = new Set();
    const guides = list(taxIds)
      .map((id) => findGuide(KYT_MAP[id] || id))
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
          applies to, current rates, deadlines, worked examples and penalties.
        </p>
        <ul class="tg-kyt-list">
          ${guides.map((g) => {
            const live = isLive(g);
            const open = live
              ? `<a class="tg-kyt-item" href="${esc(base)}#/guides/${esc(g.slug)}?from=kyt">`
              : '<div class="tg-kyt-item is-draft">';
            return `
            <li>
              ${open}
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
      renderIndex(root);
      return;
    }
    const guide = findGuide(match[1]);
    if (guide && isLive(guide)) renderGuide(root, guide);
    else renderNotFound(root);
  }

  function mount(selector) {
    const root = document.querySelector(selector);
    if (!root) throw new Error(`TaxGuides: no element matches "${selector}"`);
    root.classList.add('tg-root');
    window.addEventListener('hashchange', () => route(root));
    route(root);
  }

  window.TaxGuides = { mount, renderGuideLinks, guides: GUIDES };
})();
