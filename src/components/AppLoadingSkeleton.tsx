export function AppLoadingSkeleton() {
  return (
    <main className="app-loading-skeleton" role="status" aria-label="Loading TaxWise">
      <span className="app-loading-skeleton__sr-only">Loading TaxWise…</span>
      <header className="app-loading-skeleton__header">
        <div className="app-loading-skeleton__brand">
          <div className="app-loading-skeleton__logo" />
          <div className="app-loading-skeleton__brand-lines"><i /><i /></div>
        </div>
        <div className="app-loading-skeleton__nav"><i /><i /><i /><i /></div>
        <div className="app-loading-skeleton__profile"><i /><b /></div>
      </header>
      <div className="app-loading-skeleton__content">
        <section className="app-loading-skeleton__hero">
          <div className="app-loading-skeleton__hero-copy">
            <i className="app-loading-skeleton__line app-loading-skeleton__line--badge" />
            <i className="app-loading-skeleton__line app-loading-skeleton__line--title" />
            <i className="app-loading-skeleton__line app-loading-skeleton__line--title-short" />
            <i className="app-loading-skeleton__line app-loading-skeleton__line--body" />
            <i className="app-loading-skeleton__line app-loading-skeleton__line--body-short" />
            <i className="app-loading-skeleton__line app-loading-skeleton__line--action" />
          </div>
          <div className="app-loading-skeleton__hero-card"><i /><i /><i /><b /></div>
        </section>
        <section className="app-loading-skeleton__stats" aria-hidden="true">
          <div /><div /><div /><div />
        </section>
        <section className="app-loading-skeleton__lower" aria-hidden="true">
          <div /><div />
        </section>
      </div>
    </main>
  );
}
