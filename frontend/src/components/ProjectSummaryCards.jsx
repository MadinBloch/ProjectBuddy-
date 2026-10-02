export default function ProjectSummaryCards({ stats, getFrameworkIcon }) {
  return (
    <section className="stats-grid">
      <article className="stat-card dashboard-panel">
        <div className="stat-label">Total scans</div>
        <div className="stat-value">{stats.total}</div>
        <div className="muted">Projects tracked in this workspace</div>
      </article>
      <article className="stat-card dashboard-panel">
        <div className="stat-label">Ready packs</div>
        <div className="stat-value">{stats.ready}</div>
        <div className="muted">Completed submissions</div>
      </article>
      <article className="stat-card dashboard-panel">
        <div className="stat-label">Active scans</div>
        <div className="stat-value">{stats.scanned}</div>
        <div className="muted">Currently scanning or generated</div>
      </article>
      <article className="stat-card dashboard-panel">
        <div className="stat-label">Top stacks</div>
        <div className="stack-row">
          {stats.frameworks.length ? [...new Set(stats.frameworks)].slice(0, 4).map((name) => (
            <span key={name} className="stack-pill">{getFrameworkIcon(name)} {name}</span>
          )) : <span className="muted">No stack yet</span>}
        </div>
      </article>
    </section>
  );
}
