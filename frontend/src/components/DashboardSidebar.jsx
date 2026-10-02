export default function DashboardSidebar({ authUser, profileInitials, dashboardSection, onSelectSection, onLogout }) {
  return (
    <aside className="dashboard-sidebar dashboard-panel">
      <div className="profile-card">
        <div className="profile-avatar">{profileInitials}</div>
        <div className="profile-meta">
          <div className="profile-name">{authUser.name || authUser.login || "Your profile"}</div>
          <div className="muted profile-email">{authUser.email || "github-user"}</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Sidebar navigation">
        <button type="button" className={`side-link ${dashboardSection === "overview" ? "active" : ""}`} onClick={() => onSelectSection("overview")}>Overview</button>
        <button type="button" className={`side-link ${dashboardSection === "repositories" ? "active" : ""}`} onClick={() => onSelectSection("repositories")}>Repositories</button>
        <button type="button" className={`side-link ${dashboardSection === "recent-scans" ? "active" : ""}`} onClick={() => onSelectSection("recent-scans")}>Recent scans</button>
        <button type="button" className={`side-link ${dashboardSection === "profile" ? "active" : ""}`} onClick={() => onSelectSection("profile")}>Profile</button>
      </nav>

      <div className="sidebar-logout">
        <button className="btn ghost" type="button" onClick={onLogout}>Logout</button>
      </div>
    </aside>
  );
}
