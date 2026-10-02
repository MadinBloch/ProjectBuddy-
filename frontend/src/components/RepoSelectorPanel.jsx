export default function RepoSelectorPanel({
  repoList,
  selectedRepo,
  selectedRepoLabel,
  repoMenuOpen,
  onToggleMenu,
  onSelectRepo,
  onScan,
  onUpload,
  onPasteGithub,
  getFrameworkIcon,
}) {
  return (
    <section id="repositories" className="dashboard-panel repo-panel">
      <div className="panel-title-row">
        <div>
          <div className="kicker">Repository</div>
          <h3>Select project source</h3>
        </div>
      </div>

      <div className="repo-actions">
        <div className="repo-select-wrap">
          <button type="button" className={`repo-select ${repoMenuOpen ? "open" : ""}`} onClick={onToggleMenu} disabled={repoList.length === 0}>
            <span>{selectedRepoLabel}</span>
            <span className="repo-caret">▾</span>
          </button>

          {repoMenuOpen && repoList.length > 0 && (
            <div className="repo-menu" role="listbox" aria-label="GitHub repositories">
              {repoList.map((repo) => (
                <button
                  key={repo.id}
                  type="button"
                  className={`repo-option ${selectedRepo === repo.full_name ? "selected" : ""}`}
                  onClick={() => onSelectRepo(repo.full_name)}
                >
                  {repo.full_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="btn primary" type="button" onClick={onScan} disabled={!selectedRepo}>Scan selected repo</button>
      </div>

      <div className="upload-box">
        <div className="kicker">Upload ZIP</div>
        <div className="upload-actions">
          <label className="btn primary file-btn">
            Upload Project ZIP
            <input type="file" accept=".zip" hidden onChange={(e) => onUpload(e.target.files[0])} />
          </label>
          <button className="btn ghost" type="button" onClick={onPasteGithub}>Paste a GitHub URL instead</button>
        </div>
      </div>
    </section>
  );
}
