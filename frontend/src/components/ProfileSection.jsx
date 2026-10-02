export default function ProfileSection({ authUser, profileInitials, onLogout }) {
  return (
    <section id="profile" className="dashboard-panel recent-panel profile-panel">
      <div className="panel-title-row">
        <div>
          <div className="kicker">Profile</div>
          <h3>Your account</h3>
        </div>
      </div>
      <div className="profile-summary">
        <div className="profile-avatar large">{profileInitials}</div>
        <div>
          <div className="profile-name large-name">{authUser.name || authUser.login || "Your profile"}</div>
          <div className="muted">{authUser.email || "github-user"}</div>
        </div>
      </div>
      <div className="profile-actions">
        <button className="btn ghost" type="button" onClick={onLogout}>Logout</button>
      </div>
    </section>
  );
}
