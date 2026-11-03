"use client";
// IntelligenceHub.jsx — renders the Intelligence Hub tabs from intelligenceHubData.js.
// Works in Next.js (app or pages router) or any React 18+ app. No extra dependencies.

import { useMemo, useState } from "react";
import { WorkspacePageHero } from "./WorkspacePageHero";
import {
  HUB_META,
  HUB_TABS,
  CASE_INDEX,
  SOURCES,
  resolveSources,
  searchHub,
} from "../../intelligenceHubData";

type Source = { label: string; url: string };
type ContentBlock =
  | { type: "h" | "p"; text: string }
  | { type: "list" | "checklist"; items: string[]; ordered?: boolean }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "callout"; text: string; tone?: "action" | "warn" | "info" };
type Article = {
  id: string;
  title: string;
  summary: string;
  tags?: string[];
  flags?: string[];
  body: ContentBlock[];
  sources?: string[];
};
type Route = {
  steps: { id: string; name: string; note: string; highlight?: boolean }[];
  branches: { from: string; name: string; trigger: string; note: string }[];
};
type HubTab = {
  id: string;
  label: string;
  summary: string;
  articles: Article[];
  route?: Route;
  updates?: { dateLabel: string; kind: string; text: string; source: string }[];
};
type CaseEntry = {
  name: string;
  citation: string;
  year: number | null;
  tabs: string[];
  topic: string;
  source: string;
};
type SearchResult = { tabId: string; article: Article };

const tabs = HUB_TABS as unknown as HubTab[];
const casesIndex = CASE_INDEX as unknown as CaseEntry[];
const sources = SOURCES as unknown as Record<string, Source>;
const hubMeta = HUB_META as { lastReviewed: string; disclaimer: string; citationNote: string; jurisdiction: string };

const FLAG_LABEL: Record<string, string> = { verify: "Verify", "sources-differ": "Sources differ" };

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "h":
      return <h4 className="ih-h4">{block.text}</h4>;
    case "p":
      return <p className="ih-p">{block.text}</p>;
    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag className="ih-list">
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </Tag>
      );
    }
    case "checklist":
      return (
        <ul className="ih-checklist">
          {block.items.map((item, i) => (
            <li key={i}>
              <label>
                <input type="checkbox" /> <span>{item}</span>
              </label>
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="ih-table-wrap">
          <table className="ih-table">
            <thead>
              <tr>
                {block.headers.map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} data-label={block.headers[c]}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "callout":
      return (
        <div className={`ih-callout ih-callout--${block.tone || "info"}`}>
          <strong>
            {block.tone === "action" ? "Action: " : block.tone === "warn" ? "Watch: " : "Note: "}
          </strong>
          {block.text}
        </div>
      );
    default:
      return null;
  }
}

function SourceList({ keys }: { keys?: string[] }) {
  const sources = resolveSources(keys);
  if (!sources.length) return null;
  return (
    <div className="ih-sources">
      <span className="ih-sources__label">Sources</span>
      <ul>
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ArticleCard({ article, defaultOpen = false }: { article: Article; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <article className={`ih-card ${open ? "is-open" : ""}`} id={article.id}>
      <button
        className="ih-card__head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div>
          <h3 className="ih-card__title">{article.title}</h3>
          <p className="ih-card__summary">{article.summary}</p>
          <div className="ih-tags">
            {(article.tags || []).map((t) => (
              <span key={t} className="ih-tag">{t}</span>
            ))}
            {(article.flags || []).map((f) => (
              <span key={f} className="ih-tag ih-tag--flag">{FLAG_LABEL[f] || f}</span>
            ))}
          </div>
        </div>
        <span className="ih-card__chevron" aria-hidden>{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="ih-card__body">
          {article.body.map((b, i) => (
            <Block key={i} block={b} />
          ))}
          <SourceList keys={article.sources} />
        </div>
      )}
    </article>
  );
}

function RouteDiagram({ route }: { route: Route }) {
  return (
    <div className="ih-route" aria-label="Uganda tax dispute route">
      <ol className="ih-route__steps">
        {route.steps.map((s) => (
          <li key={s.id} className={s.highlight ? "is-highlight" : ""}>
            <strong>{s.name}</strong>
            <span>{s.note}</span>
            {route.branches
              .filter((b) => b.from === s.id)
              .map((b) => (
                <div key={b.name} className="ih-route__branch">
                  <em>{b.trigger} →</em> <strong>{b.name}</strong> <span>{b.note}</span>
                </div>
              ))}
          </li>
        ))}
      </ol>
    </div>
  );
}

function UpdateLog({ updates }: { updates: NonNullable<HubTab["updates"]> }) {
  return (
    <div className="ih-table-wrap">
      <table className="ih-table">
        <thead>
          <tr><th>Date</th><th>Update</th><th>Source</th></tr>
        </thead>
        <tbody>
          {updates.map((u, i) => {
            const src = sources[u.source];
            return (
              <tr key={i}>
                <td data-label="Date" className="ih-nowrap">
                  {u.dateLabel}
                  <span className={`ih-kind ih-kind--${u.kind}`}>{u.kind}</span>
                </td>
                <td data-label="Update">{u.text}</td>
                <td data-label="Source">
                  {src ? <a href={src.url} target="_blank" rel="noopener noreferrer">{src.label.split(" — ")[0]}</a> : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CaseIndex({ tabId }: { tabId: string }) {
  const cases = casesIndex.filter((c) => c.tabs.includes(tabId));
  if (!cases.length) return null;
  return (
    <section className="ih-section">
      <h2 className="ih-h2">Cases in this section</h2>
      <div className="ih-table-wrap">
        <table className="ih-table">
          <thead><tr><th>Case</th><th>Citation</th><th>Year</th><th>Topic</th></tr></thead>
          <tbody>
            {cases.map((c) => {
              const src = sources[c.source];
              return (
                <tr key={c.name}>
                  <td data-label="Case">
                    {src ? <a href={src.url} target="_blank" rel="noopener noreferrer">{c.name}</a> : c.name}
                  </td>
                  <td data-label="Citation">{c.citation}</td>
                  <td data-label="Year">{c.year ?? "—"}</td>
                  <td data-label="Topic">{c.topic}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function IntelligencePortal({ initialTab = "practice-notes" }: { initialTab?: string } = {}) {
  const [activeId, setActiveId] = useState(initialTab);
  const [query, setQuery] = useState("");
  const tab = tabs.find((t) => t.id === activeId) || tabs[0];
  const results = useMemo(() => searchHub(query) as SearchResult[], [query]);
  const searching = query.trim().length > 0;

  return (
    <div className="workspace-feature-page ih" style={{ padding: "0 24px" }}>
      <style>{CSS}</style>

      <div style={{ width: "100%", maxWidth: 1020, margin: "0 auto" }}>
        <WorkspacePageHero
          eyebrow="LEGAL · TAX INSIGHTS"
          title="Intelligence hub"
          description={`Practical guidance, appeals thinking, and compliance updates for ${hubMeta.jurisdiction}.`}
        />

      <div className="ih-toolbar">
        <nav className="ih-pills" role="tablist" aria-label="Intelligence Hub sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={t.id === activeId}
              className={`ih-pill ${t.id === activeId && !searching ? "is-active" : ""}`}
              onClick={() => { setActiveId(t.id); setQuery(""); }}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <input
          className="ih-search"
          type="search"
          placeholder="Search notes, cases, sections…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="ih-panel">
        {searching ? (
          <section className="ih-section">
            <h2 className="ih-h2">
              {results.length} result{results.length === 1 ? "" : "s"} for “{query}”
            </h2>
            {results.length === 0 && <p className="ih-p">No matching guidance found. Try another search term.</p>}
            {results.map(({ tabId, article }) => (
              <div key={`${tabId}-${article.id}`}>
                <span className="ih-eyebrow">{tabs.find((t) => t.id === tabId)?.label}</span>
                <ArticleCard article={article} />
              </div>
            ))}
          </section>
        ) : (
          <>
            <p className="ih-lead">{tab.summary}</p>

            {tab.route && (
              <section className="ih-section">
                <h2 className="ih-h2">Dispute route</h2>
                <RouteDiagram route={tab.route} />
              </section>
            )}

            {tab.updates && (
              <section className="ih-section">
                <h2 className="ih-h2">Update log (newest first)</h2>
                <UpdateLog updates={tab.updates} />
              </section>
            )}

            <section className="ih-section">
            {tab.articles.map((a, i) => (
                <ArticleCard key={a.id} article={a} defaultOpen={i === 0} />
              ))}
            </section>

            <CaseIndex tabId={tab.id} />
          </>
        )}

        <footer className="ih-footer">
          <p>{hubMeta.citationNote}</p>
          <p>Last reviewed {hubMeta.lastReviewed}. {hubMeta.disclaimer}</p>
        </footer>
      </div>
      </div>
    </div>
  );
}

const CSS = `
.ih{--navy:#13254a;--green:#16a34a;--ink:#1b2333;--muted:#5b6475;--line:#e6e8ec;--card:#fff;--bg:#f6f6f4;
  font-family:Inter,system-ui,-apple-system,Segoe UI,sans-serif;color:var(--ink);}
.ih-toolbar{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:16px}
.ih-pills{display:flex;flex-wrap:wrap;gap:12px}
.ih-pill{padding:14px 34px;border-radius:999px;border:1px solid var(--line);background:#fff;color:var(--navy);
  font-weight:600;font-size:15px;cursor:pointer;transition:all .15s}
.ih-pill:hover{border-color:#c9cdd4}
.ih-pill.is-active{border-color:var(--green);color:var(--green);box-shadow:0 4px 14px rgba(22,163,74,.12)}
.ih-search{flex:1;min-width:220px;max-width:340px;padding:12px 16px;border-radius:999px;border:1px solid var(--line);font-size:14px}
.ih-panel{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:28px}
.ih-lead{font-size:16px;line-height:1.6;color:var(--ink);margin:0 0 20px;max-width:820px}
.ih-section{margin-bottom:28px}
.ih-h2{font-size:18px;color:var(--navy);margin:0 0 12px}
.ih-eyebrow{display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:14px 0 4px}
.ih-card{border:1px solid var(--line);border-radius:14px;margin-bottom:12px;background:#fff}
.ih-card.is-open{border-color:#cfd6e2}
.ih-card__head{width:100%;display:flex;justify-content:space-between;gap:16px;text-align:left;background:none;border:0;padding:18px 20px;cursor:pointer;color:inherit;font:inherit}
.ih-card__title{margin:0 0 4px;font-size:16px;color:var(--navy)}
.ih-card__summary{margin:0 0 8px;color:var(--muted);font-size:14px;line-height:1.5}
.ih-card__chevron{font-size:22px;color:var(--muted);line-height:1}
.ih-card__body{padding:0 20px 20px}
.ih-tags{display:flex;flex-wrap:wrap;gap:6px}
.ih-tag{font-size:11.5px;padding:3px 9px;border-radius:999px;background:#eef1f6;color:var(--navy)}
.ih-tag--flag{background:#fff4e0;color:#9a5b00}
.ih-p{line-height:1.65;margin:0 0 12px}
.ih-h4{font-size:14.5px;color:var(--navy);margin:20px 0 8px;padding-top:12px;border-top:1px dashed var(--line)}
.ih-h4:first-child{border-top:0;padding-top:0;margin-top:0}
.ih-list,.ih-checklist{margin:0 0 12px;padding-left:22px;line-height:1.6}
.ih-list li,.ih-checklist li{margin-bottom:6px}
.ih-checklist{list-style:none;padding-left:0}
.ih-checklist label{display:flex;gap:8px;align-items:flex-start;cursor:pointer}
.ih-checklist input{margin-top:4px;accent-color:var(--green)}
.ih-table-wrap{overflow-x:auto;margin:0 0 14px}
.ih-table{width:100%;border-collapse:collapse;font-size:13.5px}
.ih-table th{background:#f3f5f9;color:var(--navy);text-align:left;padding:10px 12px;border-bottom:1px solid var(--line);font-weight:600}
.ih-table td{padding:10px 12px;border-bottom:1px solid var(--line);vertical-align:top;line-height:1.5}
.ih-table a{color:var(--navy)}
.ih-nowrap{white-space:nowrap}
.ih-kind{display:block;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-top:2px}
.ih-kind--case{color:#1d4ed8}.ih-kind--law{color:var(--green)}.ih-kind--admin{color:#9a5b00}
.ih-callout{border-radius:10px;padding:12px 14px;margin:0 0 12px;font-size:14px;line-height:1.55;border-left:4px solid}
.ih-callout--action{background:#ecfdf3;border-color:var(--green)}
.ih-callout--warn{background:#fff7e8;border-color:#e3a008}
.ih-callout--info{background:#eef4ff;border-color:#3b6fd8}
.ih-sources{margin-top:14px;padding-top:12px;border-top:1px dashed var(--line);font-size:13px}
.ih-sources__label{font-weight:600;color:var(--muted);text-transform:uppercase;font-size:11px;letter-spacing:.06em}
.ih-sources ul{margin:6px 0 0;padding-left:18px}
.ih-sources a{color:var(--navy)}
.ih-route__steps{list-style:none;padding:0;margin:0;counter-reset:s}
.ih-route__steps>li{position:relative;border:1px solid var(--line);border-radius:12px;padding:12px 16px 12px 52px;margin-bottom:14px;counter-increment:s}
.ih-route__steps>li::before{content:counter(s);position:absolute;left:14px;top:12px;width:26px;height:26px;border-radius:50%;
  background:#eef1f6;color:var(--navy);font-weight:700;display:grid;place-items:center;font-size:13px}
.ih-route__steps>li:not(:last-child)::after{content:"";position:absolute;left:27px;bottom:-15px;width:1px;height:14px;background:#c9cdd4}
.ih-route__steps>li.is-highlight{border-color:var(--green);background:#f3fbf6}
.ih-route__steps strong{display:block;color:var(--navy)}
.ih-route__steps span{color:var(--muted);font-size:13.5px}
.ih-route__branch{margin-top:8px;padding:8px 12px;border-radius:8px;background:#f7f8fa;font-size:13.5px}
.ih-route__branch strong{display:inline}
.ih-route__branch em{color:var(--muted)}
.ih-footer{border-top:1px solid var(--line);margin-top:8px;padding-top:14px;color:var(--muted);font-size:12.5px;line-height:1.55}
@media (max-width:640px){
  .ih-panel{padding:18px}
  .ih-pill{padding:10px 18px;font-size:14px}
  .ih-table thead{display:none}
  .ih-table tr{display:block;border-bottom:1px solid var(--line);padding:6px 0}
  .ih-table td{display:block;border:0;padding:4px 0}
  .ih-table td::before{content:attr(data-label);display:block;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
}
`;
