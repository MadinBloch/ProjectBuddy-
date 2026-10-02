import { useCallback, useEffect, useMemo, useState } from "react";
import Landing from "./Landing.jsx";
import DashboardSidebar from "./components/DashboardSidebar.jsx";
import ProjectSummaryCards from "./components/ProjectSummaryCards.jsx";
import RepoSelectorPanel from "./components/RepoSelectorPanel.jsx";
import RecentScansList from "./components/RecentScansList.jsx";
import ProfileSection from "./components/ProfileSection.jsx";
import { apiFetch } from "./api/client.js";
import { emptyAnswers, guessTitle, innerHtml } from "./utils/project.js";

const NAV_LINKS = [
  ["#how", "How it works"],
  ["#pack", "What's included"],
  ["#diagrams", "Diagrams"],
  ["#faq", "FAQ"],
];

function getStoredTheme() {
  try {
    return window.localStorage.getItem("pb-theme") || "light";
  } catch {
    return "light";
  }
}

export default function App() {
  const [step, setStep] = useState("home");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [project, setProject] = useState(null);
  const [github, setGithub] = useState("");
  const [drag, setDrag] = useState(false);
  const [tab, setTab] = useState("report");
  const [answers, setAnswers] = useState(emptyAnswers());
  const [editOpen, setEditOpen] = useState(null);
  const [theme, setTheme] = useState(getStoredTheme);
  const [scrolled, setScrolled] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [repoList, setRepoList] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [repoMenuOpen, setRepoMenuOpen] = useState(false);
  const [dashboardProjects, setDashboardProjects] = useState([]);
  const [dashboardSection, setDashboardSection] = useState("overview");

  const refreshDashboard = useCallback(async () => {
    if (!authUser) return;
    try {
      const data = await apiFetch("/api/projects");
      setDashboardProjects(data.projects || []);
    } catch {
      setDashboardProjects([]);
    }
  }, [authUser]);

  useEffect(() => {
    apiFetch("/api/auth/session")
      .then((data) => {
        const user = data.user || null;
        setAuthUser(user);
        if (!user) {
          setRepoList([]);
          setSelectedRepo("");
          setStep("home");
          return;
        }
        apiFetch("/api/auth/user/repos")
          .then((repoData) => {
            const repos = repoData.repos || [];
            setRepoList(repos);
            setSelectedRepo(repos[0]?.full_name || "");
            setStep("dashboard");
          })
          .catch(() => {
            setRepoList([]);
            setSelectedRepo("");
            setStep("dashboard");
          });
      })
      .catch(() => setAuthUser(null));
  }, []);

  useEffect(() => {
    if (authUser) {
      setStep("dashboard");
      refreshDashboard();
    }
  }, [authUser, refreshDashboard]);

  useEffect(() => {
    if (project?.id && authUser) {
      refreshDashboard();
    }
  }, [project?.id, project?.status, authUser, refreshDashboard]);

  useEffect(() => {
    if (repoList.length && !selectedRepo) {
      setSelectedRepo(repoList[0].full_name || "");
    }
  }, [repoList, selectedRepo]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("pb-theme", theme);
    } catch {
      // Ignore browser storage failures; the app should still render.
    }
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!project?.id) return;
    if (!["scanning", "generating"].includes(project.status)) return;
    const t = setInterval(async () => {
      try {
        const data = await apiFetch(`/api/projects/${project.id}`);
        setProject(data);
        if (data.status === "scanned") {
          setAnswers((a) => ({
            ...a,
            modules: data.scan?.modules || [],
            title: a.title || data.scan?.suggestedTitle || guessTitle(data.scan),
            problem: a.problem || data.scan?.suggestedProblem || "",
            futureWork: a.futureWork || data.scan?.suggestedFuture || "",
          }));
          setStep("questions");
          setBusy(false);
        }
        if (data.status === "ready") {
          setStep("preview");
          setTab("report");
          setBusy(false);
        }
        if (["rejected", "failed", "failed_generate"].includes(data.status)) {
          setError(data.error || "Something went wrong.");
          setBusy(false);
        }
      } catch (e) {
        setError(e.message);
        setBusy(false);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [project?.id, project?.status]);

  const stackLine = useMemo(() => {
    const s = project?.scan?.stack;
    if (!s) return "";
    return [s.language, ...(s.frameworks || []), ...(s.database || [])].filter(Boolean).join(" · ");
  }, [project]);

  const profileInitials = useMemo(() => {
    const source = authUser?.name || authUser?.login || authUser?.email || "User";
    const initials = source.split(/[\s_-]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
    return initials || "U";
  }, [authUser]);

  async function startZip(file) {
    setError("");
    if (!file || !file.name.toLowerCase().endsWith(".zip")) {
      setError("Upload a .zip of your project folder.");
      return;
    }
    setBusy(true);
    setStep("scan");
    try {
      const res = await fetch("/api/projects/upload", {
        method: "POST",
        headers: { "Content-Type": "application/zip" },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setProject(data);
    } catch (e) {
      setError(e.message);
      setBusy(false);
      setStep("home");
    }
  }

  async function startGithub(e) {
    e.preventDefault();
    setError("");
    if (!github.trim()) {
      setError("Paste a public GitHub URL, or upload a zip.");
      return;
    }
    setBusy(true);
    setStep("scan");
    try {
      const data = await apiFetch("/api/projects", { method: "POST", json: { github } });
      setProject(data);
    } catch (e) {
      setError(e.message);
      setBusy(false);
      setStep("home");
    }
  }

  async function scanSelectedRepo() {
    if (!selectedRepo) {
      setError("Choose a GitHub repository to analyze.");
      return;
    }
    setBusy(true);
    setStep("scan");
    try {
      const data = await apiFetch("/api/projects", { method: "POST", json: { github: `https://github.com/${selectedRepo}` } });
      setProject(data);
    } catch (e) {
      setError(e.message);
      setBusy(false);
      setStep("home");
    }
  }

  async function generate(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    setStep("scan");
    try {
      const data = await apiFetch(`/api/projects/${project.id}/generate`, {
        method: "POST",
        json: { answers },
      });
      setProject((p) => ({ ...p, ...data }));
    } catch (e) {
      setError(e.message);
      setBusy(false);
      setStep("questions");
    }
  }

  async function downloadZip() {
    setError("");
    setBusy(true);
    try {
      window.location.href = `/api/projects/${project.id}/download`;
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function downloadFile(rel) {
    setError("");
    try {
      const a = document.createElement("a");
      a.href = `/api/projects/${project.id}/file?path=${encodeURIComponent(rel)}&download=1`;
      a.download = rel.split("/").pop();
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setError(e.message);
    }
  }

  function loginWithGithub() {
    window.location.assign("/api/auth/github");
  }

  function logout() {
    apiFetch("/api/auth/logout", { method: "POST" })
      .then(() => {
        setAuthUser(null);
        setRepoList([]);
        setSelectedRepo("");
        setProject(null);
        setError("");
        setStep("home");
      })
      .catch(() => {
        setAuthUser(null);
        setRepoList([]);
        setSelectedRepo("");
        setProject(null);
        setError("");
        setStep("home");
      });
  }

  function goHome() {
    if (authUser) {
      setStep("dashboard");
    } else {
      setStep("home");
    }
    setError("");
    setProject(null);
    setGithub("");
    setAnswers(emptyAnswers());
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function goCreateProject(e) {
    if (e) e.preventDefault();
    if (authUser) {
      setStep("dashboard");
      setError("");
      setDashboardSection("overview");
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    goHome();
    const target = document.getElementById("start");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function openDashboardSection(section) {
    setDashboardSection(section);
    const target = document.getElementById(section);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function reset() {
    if (authUser) {
      setStep("dashboard");
      setError("");
      setProject(null);
      setGithub("");
      setAnswers(emptyAnswers());
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    goHome();
  }

  function goStep(next) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  async function openProjectFromHistory(item) {
    if (!item?.id) return;
    setError("");
    setBusy(true);
    try {
      const data = await apiFetch(`/api/projects/${item.id}`);
      setProject(data);
      if (data.status === "scanning") {
        setStep("scan");
      } else if (data.status === "generating") {
        setStep("scan");
      } else if (data.status === "scanned") {
        setAnswers((a) => ({
          ...a,
          modules: data.scan?.modules || [],
          title: a.title || data.scan?.suggestedTitle || guessTitle(data.scan),
          problem: a.problem || data.scan?.suggestedProblem || "",
          futureWork: a.futureWork || data.scan?.suggestedFuture || "",
        }));
        setStep("questions");
      } else if (data.status === "ready") {
        setStep("preview");
        setTab("report");
      } else {
        setStep("dashboard");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function regenerate(section) {
    setError("");
    setBusy(true);
    try {
      const data = await apiFetch(`/api/projects/${project.id}/regenerate`, { method: "POST", json: { section } });
      setProject(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const preview = project?.preview || {};
  const selectedRepoLabel = selectedRepo || (repoList[0]?.full_name || "Select a repository");
  const dashboardStats = useMemo(() => {
    const total = dashboardProjects.length;
    const ready = dashboardProjects.filter((p) => p.status === "ready").length;
    const scanned = dashboardProjects.filter((p) => ["scanned", "ready", "generating"].includes(p.status)).length;
    const frameworks = dashboardProjects.flatMap((p) => p.frameworks || []);
    return { total, ready, scanned, frameworks };
  }, [dashboardProjects]);

  return (
    <div className="shell">
      <header className={`nav ${scrolled ? "scrolled" : ""}`}>
        <div className="wrap nav-inner">
          <button className="brand" type="button" onClick={goHome}>
            <div className="mark">P</div> ProjectBuddy
          </button>
          {step === "home" ? (
            <nav className="nav-links">
              {NAV_LINKS.map(([href, label]) => (
                <a key={href} href={href}>{label}</a>
              ))}
            </nav>
          ) : (
            <nav className="nav-links">
              <button className="btn link" type="button" onClick={goHome}>← Home</button>
            </nav>
          )}
          <div className="nav-right">
            <button
              className="theme-switch"
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle dark mode"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span className="knob">{theme === "dark" ? <MoonIcon /> : <SunIcon />}</span>
            </button>
            {authUser ? (
              <>
                <span className="user-pill">Hi, {authUser.name || authUser.email?.split("@")[0]}</span>
                <button className="btn ghost" type="button" onClick={logout}>Logout</button>
              </>
            ) : (
              <button className="btn primary" type="button" onClick={loginWithGithub}>Login with GitHub</button>
            )}
            <a className="btn primary" href="#start" onClick={goCreateProject}>
              Create Project
            </a>
          </div>
        </div>
      </header>

      {(step === "dashboard" || (step === "home" && authUser)) && authUser && (
        <main className="wrap page dashboard-shell anim-up" key="dashboard">
          <div className="dashboard-layout">
            <DashboardSidebar
              authUser={authUser}
              profileInitials={profileInitials}
              dashboardSection={dashboardSection}
              onSelectSection={openDashboardSection}
              onLogout={logout}
            />

            <div className="dashboard-main">
              <header id="overview" className="dashboard-header dashboard-panel">
                <div>
                  <div className="kicker">Welcome back</div>
                  <h2>Project dashboard</h2>
                  <p className="muted">Choose a repository to analyze and review the latest project insights in one place.</p>
                </div>
                <button className="btn primary" type="button" onClick={() => setStep("dashboard")}>New project</button>
              </header>

              <ProjectSummaryCards stats={dashboardStats} getFrameworkIcon={getFrameworkIcon} />

              <RepoSelectorPanel
                repoList={repoList}
                selectedRepo={selectedRepo}
                selectedRepoLabel={selectedRepoLabel}
                repoMenuOpen={repoMenuOpen}
                onToggleMenu={() => setRepoMenuOpen((open) => !open)}
                onSelectRepo={(repoName) => {
                  setSelectedRepo(repoName);
                  setRepoMenuOpen(false);
                }}
                onScan={scanSelectedRepo}
                onUpload={(file) => startZip(file)}
                onPasteGithub={() => setStep("dashboard")}
                getFrameworkIcon={getFrameworkIcon}
              />

              <RecentScansList items={dashboardProjects} onSelectProject={openProjectFromHistory} getFrameworkIcon={getFrameworkIcon} />

              <ProfileSection authUser={authUser} profileInitials={profileInitials} onLogout={logout} />

              {error && <div className="err dashboard-error">{error}</div>}
            </div>
          </div>
        </main>
      )}

      {step === "home" && (
        <Landing
          github={github}
          setGithub={setGithub}
          drag={drag}
          setDrag={setDrag}
          startZip={startZip}
          startGithub={startGithub}
          error={error}
          authUser={authUser}
          onGithubLogin={loginWithGithub}
          repoList={repoList}
          selectedRepo={selectedRepo}
          setSelectedRepo={setSelectedRepo}
          onSelectRepo={scanSelectedRepo}
          onCreateProject={goCreateProject}
        />
      )}

      {step === "scan" && (
        <main className="wrap page scan-shell anim-up" key="scan">
          <div className="scan-panel dashboard-panel">
            <div className="kicker">{project?.status === "generating" ? "Generating" : "Analyzing"}</div>
            <h2>
              {project?.status === "generating"
                ? "Building your pack from source"
                : "Reading your project"}
            </h2>
            <p className="muted">
              {project?.status === "generating"
                ? (project.progress?.label || "Writing only what the repository supports.")
                : "Detecting languages, frameworks, tables, models and routes. Missing pieces will be omitted."}
            </p>
            <ProgressList project={project} />
            <p className="scan-status"><span className="spinner" /> {project?.progress?.percent ? `${project.progress.percent}%` : "Please wait…"}</p>
            {error && <div className="err">{error}</div>}
          </div>
        </main>
      )}

      {step === "questions" && project?.scan && (
        <main className="wrap page" key="questions">
          <div className="panel" style={{ maxWidth: 860, margin: "0 auto" }}>
            <div className="kicker">Scan complete — your project, not a template</div>
            <h2>{project.scan.stackLabel || stackLine || "Project scan"}</h2>
            <p className="muted">
              {project.scan.fileCount} files · {project.scan.tables?.length || 0} tables ·{" "}
              {project.scan.routes?.length || 0} routes · {project.scan.models?.length || 0} models
              {project.scan.confidence != null ? ` · confidence ${Math.round(project.scan.confidence * 100)}%` : ""}
            </p>
            <div className="chips" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "14px 0" }}>
              {((project.scan?.stack?.frameworks || project.scan?.intelligence?.frameworks || [])).map((framework) => (
                <span key={framework} className="anim-pop" style={{ background: "var(--surface-3)", borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 500 }}>{getFrameworkIcon(framework)} {framework}</span>
              ))}
              {(project.scan.modules || []).map((m) => (
                <span key={m} className="anim-pop" style={{ background: "var(--surface-3)", borderRadius: 999, padding: "6px 12px", fontSize: 12.5, fontWeight: 500 }}>{m}</span>
              ))}
            </div>
            {!!project.scan.warnings?.length && <div className="warn">{project.scan.warnings.join(" ")}</div>}
            <HealthBlock health={project.scan.health} />
            <EvidenceBlock evidence={project.scan.evidence} />
            <form onSubmit={generate}>
              <div className="form">
                <div><label>Student name</label><input required value={answers.studentName} onChange={(e) => setAnswers({ ...answers, studentName: e.target.value })} /></div>
                <div><label>Enrollment number</label><input required value={answers.enrollment} onChange={(e) => setAnswers({ ...answers, enrollment: e.target.value })} /></div>
                <div><label>College</label><input required value={answers.college} onChange={(e) => setAnswers({ ...answers, college: e.target.value })} /></div>
                <div>
                  <label>Course</label>
                  <select value={answers.course} onChange={(e) => setAnswers({ ...answers, course: e.target.value })}>
                    <option>BCA</option><option>MCA</option><option>BTech</option><option>Diploma</option><option>BSc IT</option>
                  </select>
                </div>
                <div><label>Guide name</label><input value={answers.guide} onChange={(e) => setAnswers({ ...answers, guide: e.target.value })} /></div>
                <div><label>Year</label><input value={answers.year} onChange={(e) => setAnswers({ ...answers, year: e.target.value })} /></div>
                <div className="full"><label>Project title</label><input required value={answers.title} onChange={(e) => setAnswers({ ...answers, title: e.target.value })} /></div>
                <div className="full"><label>Problem statement</label><textarea required value={answers.problem} onChange={(e) => setAnswers({ ...answers, problem: e.target.value })} /></div>
                <div className="full"><label>Future work</label><textarea value={answers.futureWork} onChange={(e) => setAnswers({ ...answers, futureWork: e.target.value })} /></div>
              </div>
              {error && <div className="err">{error}</div>}
              <p style={{ marginTop: 20 }}>
                <button className="btn primary lg" type="submit" disabled={busy}>Generate pack</button>
              </p>
            </form>
          </div>
        </main>
      )}

      {step === "preview" && (
        <main className="wrap page" key="preview">
          <div className="studio-head">
            <div>
              <div className="kicker">Pack ready · grounded in source</div>
              <h2>{preview.title || "Your project pack"}</h2>
              <p className="muted">{preview.student} · {preview.course} · {preview.college} · {preview.stackLabel}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn ghost" onClick={() => regenerate("all")} disabled={busy}>Regenerate pack</button>
              <button className="btn primary" onClick={downloadZip} disabled={busy}>Download all (zip)</button>
            </div>
          </div>
          <HealthBlock health={preview.health || project.scan?.health} />
          <EvidenceBlock evidence={preview.evidence || project.scan?.evidence} />

          <div className="tabs">
            {[
              ["report", "Report"],
              ["diagrams", "Diagrams"],
              ["slides", "PPT"],
              ["viva", "Viva"],
              ["demo", "Demo"],
              ["files", "Files"],
            ].map(([id, label]) => (
              <button key={id} className={`tab ${tab === id ? "on" : ""}`} onClick={() => setTab(id)}>{label}</button>
            ))}
          </div>

          <div key={tab} className="anim-up">
            {tab === "report" && (
              <div>
                <SectionBar onEdit={() => setEditOpen("report")} onRegen={() => regenerate("report")} />
                <div className="doc" dangerouslySetInnerHTML={{ __html: innerHtml(preview.reportHtml) }} />
              </div>
            )}

            {tab === "diagrams" && (
              <div className="diagram-grid">
                {(preview.diagrams || []).map((d, i) => (
                  <article className="diagram-card" key={d.id} style={{ animationDelay: `${i * 0.05}s` }}>
                    <header>
                      {d.title}{d.omitted ? " (omitted)" : ""}
                      <button className="btn ghost sm" onClick={() => downloadFile(`03-diagrams/${d.id}.svg`)}>Download SVG</button>
                    </header>
                    <div className="canvas" dangerouslySetInnerHTML={{ __html: d.svg }} />
                  </article>
                ))}
              </div>
            )}

            {tab === "slides" && (
              <div>
                <SectionBar onRegen={() => regenerate("slides")} />
                <div className="slides">
                  {(preview.slides || []).map((s, i) => (
                    <article className="slide" key={s.title + i} style={{ animationDelay: `${i * 0.05}s` }}>
                      <div className="num">Slide {i + 1} / {(preview.slides || []).length}</div>
                      <div>
                        <h3>{s.title}</h3>
                        <p>{s.body}</p>
                      </div>
                    </article>
                  ))}
                  <p><button className="btn ghost" onClick={() => downloadFile("06-presentation.html")}>Download presentation HTML</button></p>
                </div>
              </div>
            )}

            {tab === "viva" && (
              <div>
                <SectionBar onRegen={() => regenerate("viva")} />
                <div className="qa">
                  {(preview.viva || []).map((item, i) => (
                    <article key={i} style={{ animationDelay: `${i * 0.04}s` }}>
                      <div className="tag">{item.category || "Viva"} · {item.source || "code"}</div>
                      <strong>Q{i + 1}. {item.q}</strong>
                      <p>{item.a}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {tab === "demo" && (
              <div>
                <SectionBar onEdit={() => setEditOpen("demo")} onRegen={() => regenerate("demo")} />
                <div className="doc" dangerouslySetInnerHTML={{ __html: innerHtml(preview.demoHtml) }} />
              </div>
            )}

            {tab === "files" && (
              <div className="files">
                {(preview.files || project.packFiles || []).map((f, i) => (
                  <div className="file-row" key={f.id || f.path} style={{ animationDelay: `${i * 0.03}s` }}>
                    <span>{f.label || f.path}</span>
                    <button className="btn ghost sm" onClick={() => downloadFile(f.path)}>Download</button>
                  </div>
                ))}
                <button className="btn primary" onClick={downloadZip}>Download all as zip</button>
              </div>
            )}
          </div>
          {error && <div className="err">{error}</div>}
          {editOpen && (
            <EditModal
              section={editOpen}
              onClose={() => setEditOpen(null)}
              onSave={async (text) => {
                await apiFetch(`/api/projects/${project.id}/section`, { method: "POST", json: { section: editOpen, text } });
                const data = await apiFetch(`/api/projects/${project.id}`);
                setProject(data);
                setEditOpen(null);
              }}
            />
          )}
        </main>
      )}
    </div>
  );
}

function FrameworkBrandIcon({ name }) {
  const key = (name || "").toLowerCase();

  if (key.includes("react") && !key.includes("native")) {
    return (
      <span className="framework-logo react" aria-label="React logo" title="React">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="2.05" fill="#61DAFB" />
          <ellipse cx="12" cy="12" rx="8.6" ry="3.6" fill="none" stroke="#61DAFB" strokeWidth="1.5" />
          <ellipse cx="12" cy="12" rx="8.6" ry="3.6" fill="none" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="8.6" ry="3.6" fill="none" stroke="#61DAFB" strokeWidth="1.5" transform="rotate(-60 12 12)" />
        </svg>
      </span>
    );
  }

  if (key.includes("laravel")) {
    return (
      <span className="framework-logo laravel" aria-label="Laravel logo" title="Laravel">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6.5 18.5 12 3.8l5.5 14.7-5.5-2.8-5.5 2.8Z" fill="#FF2D20" opacity="0.9" />
          <path d="M10.2 16.3 12 8.8l1.8 7.5-1.8.9-1.8-.9Z" fill="#fff" />
        </svg>
      </span>
    );
  }

  if (key.includes("python")) {
    return (
      <span className="framework-logo python" aria-label="Python logo" title="Python">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9.2 2.5c-1.7 0-1.6.7-1.6 1.6v1.8H12c1.8 0 2.8 1 2.8 2.8v1.7c0 1.9-1.2 2.9-2.9 2.9H7.8c-1.7 0-1.8.8-1.8 1.6v1.7c0 1.9 1.1 2.9 3 2.9h2.1v-1.7H9.1c-.8 0-1.1-.3-1.1-.9v-1.6c0-.7.3-1 .9-1h4.7c2.1 0 4.2-1.6 4.2-4.2V8.8c0-2.2-1.9-4.3-4.3-4.3H9.2Zm3.9 7.1c.9 0 1.5.7 1.5 1.5s-.6 1.5-1.5 1.5-1.5-.7-1.5-1.5.6-1.5 1.5-1.5Z" fill="#3776AB" />
          <path d="M14.8 21.5c1.7 0 1.6-.7 1.6-1.6v-1.8H12c-1.8 0-2.8-1-2.8-2.8v-1.7c0-1.9 1.2-2.9 2.9-2.9h3.1c1.7 0 1.8-.8 1.8-1.6v-1.7c0-1.9-1.1-2.9-3-2.9h-2.1v1.7h2.1c.8 0 1.1.3 1.1.9v1.6c0 .7-.3 1-.9 1H9.1c-2.1 0-4.2 1.6-4.2 4.2v2c0 2.2 1.9 4.3 4.3 4.3h5.6Z" fill="#FFD43B" opacity="0.9" />
        </svg>
      </span>
    );
  }

  if (key.includes("node")) {
    return (
      <span className="framework-logo node" aria-label="Node.js logo" title="Node.js">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2.4 4.7 6.5v11L12 21.6l7.3-4.1v-11L12 2.4Zm0 2.3 5.2 3-5.2 3-5.2-3 5.2-3Zm-5.7 4.5 4.7 2.7v6.3l-4.7-2.7V9.2Zm11.4 0v6.3l-4.7 2.7v-6.3l4.7-2.7Z" fill="#68A063" />
        </svg>
      </span>
    );
  }

  if (key.includes("php")) {
    return (
      <span className="framework-logo php" aria-label="PHP logo" title="PHP">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M7.5 5.5h9.1a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7.5a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Zm-1.2 5.2h3.7v6.1H6.3v-6.1Zm9.5 0h-4.9v1.8h1.8v1.5h-1.8v2.8h-1.9v-6.1h6.8v-1.8Z" fill="#777BB4" />
        </svg>
      </span>
    );
  }

  if (key.includes("django") || key.includes("flask") || key.includes("java") || key.includes("spring")) {
    return (
      <span className="framework-logo generic" aria-label="Framework logo" title={name}>
        <span>{name.slice(0, 1).toUpperCase()}</span>
      </span>
    );
  }

  return (
    <span className="framework-logo generic" aria-label="Framework logo" title={name}>
      <span>{(name || "F").slice(0, 1).toUpperCase()}</span>
    </span>
  );
}

function getFrameworkIcon(name) {
  if (!name) return <FrameworkBrandIcon name="Laravel" />;
  return <FrameworkBrandIcon name={name} />;
}

function ProgressList({ project }) {
  const steps = project?.steps || [
    { id: "scan", label: "Reading repository evidence" },
    { id: "understand", label: "Understanding the project" },
    { id: "report", label: "Writing the report" },
    { id: "diagrams", label: "Drawing diagrams" },
    { id: "pack", label: "Assembling the pack" },
  ];
  const current = project?.progress?.step;
  const percent = project?.progress?.percent || 0;
  return (
    <div className="progress">
      <div className="bar"><span style={{ width: Math.max(8, percent) + "%" }} /></div>
      <ul>
        {steps.map((s) => (
          <li key={s.id} className={s.id === current ? "on" : percent === 100 ? "done" : ""}>{s.label}</li>
        ))}
      </ul>
    </div>
  );
}

function HealthBlock({ health }) {
  if (!health) return null;
  const groups = Object.entries(health);
  return (
    <div className="health">
      {groups.map(([k, items]) => (
        <div key={k} className="health-col">
          <div className="health-k">{k}</div>
          {(items || []).slice(0, 4).map((it) => (
            <div key={it.label} className={`health-item ${it.ok ? "ok" : "miss"}`}>
              <strong>{it.label}</strong>
              <span>{it.detail}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function EvidenceBlock({ evidence }) {
  if (!evidence?.length) return null;
  return (
    <div className="evidence">
      <div className="health-k">Evidence from source</div>
      {evidence.slice(0, 8).map((e, i) => (
        <div key={i} className="ev-row" style={{ animationDelay: `${i * 0.04}s` }}>
          <strong>{e.fact}</strong> {String(e.value)}
          <em>{(e.evidence || []).slice(0, 2).join(" · ")}</em>
        </div>
      ))}
    </div>
  );
}

function SectionBar({ onEdit, onRegen }) {
  return (
    <div className="section-bar">
      {onEdit && <button className="btn ghost sm" type="button" onClick={onEdit}>Edit</button>}
      {onRegen && <button className="btn ghost sm" type="button" onClick={onRegen}>Regenerate</button>}
    </div>
  );
}

function EditModal({ section, onClose, onSave }) {
  const [text, setText] = useState("");
  return (
    <div className="modal" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <h3>Edit {section}</h3>
        <p className="muted">Replace only this section. Do not invent tables or APIs that are not in your repo.</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste corrected text" />
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn primary" type="button" onClick={() => onSave(text)}>Save</button>
          <button className="btn ghost" type="button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function SunIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M17 8l-5-5-5 5" />
      <path d="M12 3v12" />
    </svg>
  );
}

// api helper and project utility functions moved to dedicated modules for safer maintenance.
