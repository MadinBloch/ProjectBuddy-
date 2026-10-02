export default function RecentScansList({ items, onSelectProject, getFrameworkIcon }) {
  return (
    <section id="recent-scans" className="dashboard-panel recent-panel">
      <div className="panel-title-row">
        <div>
          <div className="kicker">Recent</div>
          <h3>Recent scans</h3>
        </div>
      </div>

      <div className="history-list">
        {items.length ? items.slice(0, 5).map((item) => (
          <button
            key={item.id}
            type="button"
            className="history-row"
            onClick={() => onSelectProject(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectProject(item);
              }
            }}
          >
            <div className="history-main">
              <div className="history-name">{item.name}</div>
              <div className="muted history-meta">{item.github || "Uploaded project"}</div>
            </div>
            <div className="history-tags">
              {(item.frameworks || []).slice(0, 3).map((framework) => (
                <span key={`${item.id}-${framework}`} className="stack-pill compact">{getFrameworkIcon(framework)} {framework}</span>
              ))}
            </div>
            <div className="history-status">
              <div className="muted status-text">{item.status}</div>
              <div className="muted status-count">{item.fileCount} files</div>
            </div>
          </button>
        )) : <div className="muted empty-state">No scans yet. Upload a project or choose a repo above.</div>}
      </div>
    </section>
  );
}
