import { useEffect, useMemo, useRef, useState } from "react";

const STACKS = [
  "React", "Next.js", "Vue", "Angular", "Node.js", "Laravel", "PHP", "Python",
  "Django", "Flask", "Java", "Spring Boot", "MySQL", "PostgreSQL", "MongoDB", "SQLite",
];

const DIAGRAMS = [
  { id: "architecture", label: "Architecture" },
  { id: "er", label: "ER Diagram" },
  { id: "usecase", label: "Use Case" },
  { id: "dfd0", label: "DFD Level 0" },
  { id: "dfd1", label: "DFD Level 1" },
  { id: "sequence", label: "Sequence" },
  { id: "activity", label: "Activity" },
  { id: "deployment", label: "Deployment" },
];

const SLIDES = [
  { title: "Title & Introduction", tag: "Slide 01", bullets: ["Project title and subtitle", "Your name, course and year", "College and guide"] },
  { title: "Problem Statement", tag: "Slide 02", bullets: ["What the system is meant to solve", "Who faces this problem", "Why it matters now"] },
  { title: "Objectives", tag: "Slide 03", bullets: ["1. Working application", "2. Persistent records", "3. Demonstrable flows"] },
  { title: "System Architecture", tag: "Slide 04", bullets: ["Client → API → Data store", "Detected from your source"], chart: true },
  { title: "Modules", tag: "Slide 05", bullets: ["Detected from source files", "One module per functional area"], counter: "1,240" },
  { title: "Database Design", tag: "Slide 06", bullets: ["Tables found in migrations or models", "Keys and relations as written"] },
  { title: "Implementation", tag: "Slide 07", bullets: ["Key files from the repository", "Stacks and libraries in use"] },
  { title: "Results", tag: "Slide 08", bullets: ["What actually runs in the demo"], chart: true },
  { title: "Future Scope", tag: "Slide 09", bullets: ["Honest next steps from gaps in source"] },
  { title: "Conclusion", tag: "Slide 10", bullets: ["Documented from the uploaded project"] },
];

const FAQS_LEFT = [
  ["What can I upload?", "A ZIP of your project folder, without node_modules or vendor. Public GitHub URLs also work."],
  ["Can I use a GitHub repository?", "Yes. Paste a public repository URL. Private repos are not supported in this version."],
  ["Does it analyze my actual code?", "Yes. Stack, tables, routes and modules come from files in the upload. Missing pieces are omitted, not invented."],
  ["What files will I receive?", "Project report, system diagrams, presentation, viva Q&A, demo script, analysis notes, and a complete ZIP."],
];

const FAQS_RIGHT = [
  ["Can I edit generated content?", "Yes. Preview in the browser, edit a section, regenerate, then download individual files or the full ZIP."],
  ["Which technologies are supported?", "Common student stacks: Laravel, PHP, React, Node, Python, Django, Flask, Java, Spring Boot, and usual SQL/NoSQL stores."],
  ["Is my project data safe?", "Uploads stay on this instance for generation. Do not include live secrets. Configuration values are redacted when detected."],
  ["Can I download individual files?", "Yes. Download the full ZIP or each report, diagram, slide deck, viva file, or demo script on its own."],
];

const PREVIEW_TABS = ["report", "diagrams", "presentation", "viva", "demo", "analysis"];

export default function LandingTemplate({ github, setGithub, drag, setDrag, startZip, startGithub, error, authUser, onGithubLogin, repoList, selectedRepo, setSelectedRepo, onSelectRepo, onCreateProject }) {
  const [diagram, setDiagram] = useState("architecture");
  const [zoom, setZoom] = useState(1);
  const [slide, setSlide] = useState(0);
  const [liveTab, setLiveTab] = useState("report");
  const [openFaq, setOpenFaq] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const goTab = (tab) => {
    setLiveTab(tab);
    document.getElementById("live")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main>
      <section className="hero wrap">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="badge anim-up">
              <b>From code to submission</b> English only
            </div>
            <h1 className="anim-up d-1">
              Build your project story
              <br />
              <span className="accent">from real source code</span>
              <br />
              into a submission pack.
            </h1>
            <p className="lead anim-up d-2">
              Upload a ZIP or scan a repository. ProjectBuddy reads the actual files in your project,
              detects the stack, architecture, routes, modules, and database structure, then creates the
              report, diagrams, viva prep, and demo material you need to present with confidence.
            </p>
            <div className="hero-actions anim-up d-3">
              <label className="btn primary lg file-btn" aria-label="Upload project ZIP file">
                <UploadIcon /> Upload Project ZIP
                <input type="file" accept=".zip" hidden onChange={(e) => startZip(e.target.files[0])} />
              </label>
              {!authUser && (
                <button type="button" className="btn ghost lg" aria-label="Login with GitHub" onClick={onGithubLogin}>
                  <GitHubIcon /> Login with GitHub
                </button>
              )}
            </div>
            <div className="trust anim-up d-4">
              <span><CheckIcon /> Real repository analysis</span>
              <span><CheckIcon /> Source-based evidence</span>
              <span><CheckIcon /> Preview before download</span>
            </div>
          </div>

          <HeroWindow visible={visible} />
        </div>
      </section>

      <section className="stack-strip wrap">
        <div className="stack-label">Works with any popular technology, framework or language</div>
        <div className="marquee">
          <div className="marquee-track">
            {[...STACKS, ...STACKS].map((s, i) => (
              <span className="stack-pill" key={`${s}-${i}`}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap" id="start">
        <Reveal>
          <div className="drop-card">
            <div
              className={`drop ${drag ? "drag" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); startZip(e.dataTransfer.files[0]); }}
            >
              <div className="drop-icon"><FolderIcon /></div>
              <h3>Drop your project folder here</h3>
              <p>ZIP your project folder or choose a file</p>
              <label className="btn primary file-btn">
                <UploadIcon /> Choose ZIP File
                <input type="file" accept=".zip" hidden onChange={(e) => startZip(e.target.files[0])} />
              </label>
              <p className="hint">Maximum 50 MB · Skip node_modules and vendor</p>
              {error && <div className="err" style={{ textAlign: "left" }}>{error}</div>}
            </div>

            <div className="or-divider">or</div>

            <div className="gh-form">
              <div className="gh-head"><GitHubIcon /> Paste GitHub repository URL</div>
              <form className="row" onSubmit={startGithub}>
                <input
                  type="url"
                  placeholder="https://github.com/username/project"
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                />
                <button className="btn primary" type="submit">Analyze Project</button>
              </form>
              <p className="hint">Public repositories only · nothing is installed on your machine</p>
            </div>

            {authUser && (
              <div className="gh-form">
                <div className="gh-head"><GitHubIcon /> Your GitHub repositories</div>
                {repoList.length ? (
                  <div className="row">
                    <select value={selectedRepo} onChange={(e) => setSelectedRepo(e.target.value)}>
                      {repoList.map((repo) => (
                        <option key={repo.id} value={repo.full_name}>{repo.full_name}</option>
                      ))}
                    </select>
                    <button className="btn primary" type="button" onClick={onSelectRepo}>Scan selected repo</button>
                  </div>
                ) : (
                  <p className="hint">Loading your repositories…</p>
                )}
              </div>
            )}
          </div>
        </Reveal>
      </section>

      <section className="wrap section" id="how">
        <Reveal>
          <div className="section-head">
            <div className="kicker">How it works</div>
            <h2>From repository to submission</h2>
            <p>ProjectBuddy does the boring work after you finish the code.</p>
          </div>
        </Reveal>
        <div className="flow">
          {[
            ["01", "Upload", "Upload a ZIP file or paste a public GitHub repository.", <UploadIcon key="i" />],
            ["02", "Analyze", "We inspect your files, routes, modules, database and structure.", <SearchIcon key="i" />],
            ["03", "Generate", "Reports, diagrams, presentation, viva and demo material are created.", <SparkIcon key="i" />],
            ["04", "Download", "Review everything and download individual files or the complete package.", <DownloadIcon key="i" />],
          ].map(([n, t, d, icon], i) => (
            <Reveal key={n} delay={i}>
              <article className="flow-card">
                <div className="top">
                  <div className="ico">{icon}</div>
                  <div>
                    <div className="n">STEP {n}</div>
                    <h3>{t}</h3>
                  </div>
                </div>
                <p>{d}</p>
                {i < 3 && <span className="arrow"><ArrowIcon /></span>}
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="wrap section" id="pack">
        <Reveal>
          <div className="section-head split">
            <div>
              <div className="kicker">What you get</div>
              <h2>Everything your project needs</h2>
              <p>Generated from your actual repository — not copied from a generic template. Click any card to preview it live.</p>
            </div>
          </div>
        </Reveal>
        <div className="out-grid">
          <Reveal delay={0}><PackCard icon={<DocIcon />} tone="" title="Project Report" tab="report" onGo={goTab}
            preview={
              <div className="report-mini">
                <div className="doc-page">
                  <div className="line accent w70" />
                  <div className="line w100" />
                  <div className="line w85" />
                  <div className="line w55" />
                </div>
                <div className="line w100" />
                <div className="line w100" />
                <div className="line w85" />
                <div className="line w40" />
              </div>
            }
            points={["Real content from your code", "Auto chapters & TOC", "Download as HTML/MD"]} />
          </Reveal>

          <Reveal delay={1}><PackCard icon={<DiagramIcon />} tone="" title="System Diagrams" tab="diagrams" onGo={goTab}
            preview={
              <div className="diag-row">
                <div className="drow"><DiagramIcon /> Use case, ER, DFD 0/1 <em>SVG</em></div>
                <div className="drow"><DiagramIcon /> Architecture, sequence <em>SVG</em></div>
                <div className="drow"><DiagramIcon /> Activity &amp; deployment <em>SVG</em></div>
              </div>
            }
            points={["8 diagram types", "Drawn from detected structure", "Missing layers omitted"]} />
          </Reveal>

          <Reveal delay={2}><PackCard icon={<DeckIcon />} tone="warm" title="Presentation" tab="presentation" onGo={goTab}
            preview={
              <div className="slide-mini">
                <div>Title<i /><i className="short" /></div>
                <div>Architecture<i /><i className="b1" /></div>
                <div>Modules<i /><i className="short" /></div>
              </div>
            }
            points={["12 professional slides", "Diagrams & screenshots", "Clean and modern design"]} />
          </Reveal>

          <Reveal delay={0}><PackCard icon={<VivaIcon />} tone="" title="Viva Q&A" tab="viva" onGo={goTab}
            preview={
              <div className="qa-mini">
                <div className="qa-row"><b>Q1</b> What is the main purpose?</div>
                <div className="qa-row"><b>Q2</b> Which database do you use?</div>
                <div className="qa-row"><b>Q3</b> Explain the main modules.</div>
              </div>
            }
            points={["30+ questions with answers", "Based on your project", "Easy to understand"]} />
          </Reveal>

          <Reveal delay={1}><PackCard icon={<PlayIcon />} tone="ok" title="Demo Script" tab="demo" onGo={goTab}
            preview={
              <ol className="demo-ol">
                <li>Open the application</li>
                <li>Show the main screen for the detected stack</li>
                <li>Walk through one real data flow</li>
              </ol>
            }
            points={["3–5 minute step-by-step guide", "Covers main functionality", "Ready to present"]} />
          </Reveal>

          <Reveal delay={2}><PackCard icon={<CodeIcon />} tone="dark" title="Project Analysis" tab="analysis" onGo={goTab}
            preview={
              <pre className="code-mini">{`{
  `}<b>"technologies"</b>{`: [`}<span className="k">"React"</span>{`, `}<span className="k">"Node.js"</span>{`],
  `}<b>"database"</b>{`: `}<span className="k">"MongoDB"</span>{`,
  `}<b>"routes"</b>{`: 14,
  `}<b>"modules"</b>{`: 9
}`}</pre>
            }
            points={["Detected technologies", "Tables, routes, modules", "Full analysis in JSON"]} />
          </Reveal>
        </div>
      </section>

      <section className="wrap section" id="diagrams">
        <Reveal>
          <div className="section-head">
            <div className="kicker">Diagram workspace</div>
            <h2>See the project before you explain it</h2>
            <p>Interactive previews — switch diagram types, zoom in, and see exactly what gets generated from your code.</p>
          </div>
        </Reveal>
        <Reveal delay={1}>
          <div className="workspace">
            <aside>
              {DIAGRAMS.map((d) => (
                <button key={d.id} className={diagram === d.id ? "on" : ""} type="button" onClick={() => { setDiagram(d.id); setZoom(1); }}>
                  <DiagramIcon /> {d.label}
                </button>
              ))}
            </aside>
            <div className="canvas-wrap">
              <div className="canvas-tools">
                <button className="tool" type="button" onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.15).toFixed(2)))}>−</button>
                <span>{Math.round(zoom * 100)}%</span>
                <button className="tool" type="button" onClick={() => setZoom((z) => Math.min(1.8, +(z + 0.15).toFixed(2)))}>+</button>
                <span className="spacer" />
                <span className="tool">{DIAGRAMS.find((d) => d.id === diagram)?.label}.svg</span>
              </div>
              <div className="canvas-stage">
                <div key={diagram} className="anim-pop" style={{ transform: `scale(${zoom})`, transition: "transform 0.3s var(--ease)" }}>
                  <DiagramPreview kind={diagram} />
                </div>
              </div>
            </div>
            <div className="canvas-meta">
              <div className="health-k">Repository evidence</div>
              <ul>
                {['Frontend framework', 'Backend runtime', 'Data layer', 'Authentication layer', 'Detected routes', 'Modules and services'].map((c) => (
                  <li key={c}><CheckIcon size={13} /> {c}</li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="wrap section" id="ppt">
        <Reveal>
          <div className="section-head">
            <div className="kicker">Presentation</div>
            <h2>Already structured. Click through it.</h2>
            <p>A 12-slide deck following the story your guide expects. Click a thumbnail or arrow to move between slides.</p>
          </div>
        </Reveal>
        <Reveal delay={1}>
          <div className="deck">
            <div className="deck-rail">
              {SLIDES.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  className={`deck-thumb ${slide === i ? "on" : ""}`}
                  onClick={() => setSlide(i)}
                  aria-label={`Go to slide ${i + 1}`}
                >
                  <span className="num">{i + 1}</span>
                  <div className="mini">
                    <b>{s.title}</b>
                    <i /><i className="short" />
                  </div>
                </button>
              ))}
            </div>

            <div className="deck-stage">
              <SlideView key={slide} slide={SLIDES[slide]} index={slide} />
              <div className="deck-nav">
                <span className="pager">{String(slide + 1).padStart(2, "0")} / {SLIDES.length}</span>
                <button type="button" aria-label="Previous slide" onClick={() => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length)}><ChevronLeft /></button>
                <button type="button" aria-label="Next slide" onClick={() => setSlide((s) => (s + 1) % SLIDES.length)}><ChevronRight /></button>
              </div>
            </div>

            <div className="deck-side">
              <h4>Slides include</h4>
              <ul>
                {SLIDES.map((s, i) => (
                  <li key={s.title}>
                    <button type="button" className={slide === i ? "on" : ""} onClick={() => setSlide(i)}>
                      <CheckIcon size={13} /> {s.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="wrap section" id="live">
        <Reveal>
          <div className="section-head">
            <div className="kicker">Preview &amp; edit</div>
            <h2>Preview everything before you download</h2>
            <p>Switch tabs to see exactly what ProjectBuddy produces — every pane is a real output type.</p>
          </div>
        </Reveal>
        <Reveal delay={1}>
          <div className="live-frame">
            <div className="live-bar">
              <span>{liveTab[0].toUpperCase() + liveTab.slice(1)} <span className="mono">· grounded in your source</span></span>
              <div className="section-bar" style={{ margin: 0 }}>
                <span className="btn ghost sm">Edit</span>
                <span className="btn dark sm">Download</span>
              </div>
            </div>
            <div className="tabs" style={{ padding: "10px 14px 0", borderBottom: 0 }}>
              {PREVIEW_TABS.map((id) => (
                <button key={id} className={`tab ${liveTab === id ? "on" : ""}`} type="button" onClick={() => setLiveTab(id)}>
                  {id[0].toUpperCase() + id.slice(1)}
                </button>
              ))}
            </div>
            <div className="live-body">
              <div className="pane" key={liveTab}>
                {liveTab === "report" && (
                  <div className="doc-fake">
                    <h3>Project Report</h3>
                    <p>Abstract, problem statement, stack, modules and routes — written only from detected source.</p>
                    <div className="doc-page">
                      <p style={{ margin: 0 }}>Empty sections are skipped instead of padded with generic essays, so nothing in the document contradicts your code.</p>
                    </div>
                  </div>
                )}
                {liveTab === "diagrams" && <div style={{ display: "grid", placeItems: "center" }}><ArchMini large /></div>}
                {liveTab === "presentation" && (
                  <div className="deck-slide live-slide" style={{ maxWidth: 420, minHeight: 220, margin: "0 auto" }}>
                    <div className="tag">Slide 04 · Architecture</div>
                    <h3>System Architecture</h3>
                    <p>Client → Application → Data store</p>
                  </div>
                )}
                {liveTab === "viva" && (
                  <div className="doc-fake">
                    <div className="qa-mini" style={{ padding: 0 }}>
                      <div className="qa-row"><b>Q1</b> What stack did you use?</div>
                      <div className="qa-row"><b>Q2</b> How is data stored?</div>
                      <div className="qa-row"><b>Q3</b> Walk me through one route.</div>
                    </div>
                    <p style={{ marginTop: 12 }}>Answers are grounded in the package/composer files found in your upload.</p>
                  </div>
                )}
                {liveTab === "demo" && (
                  <div className="doc-fake">
                    <h3>Demo script</h3>
                    <p>0:00 — introduce the aim. 0:40 — open a detected screen. 1:10 — show one real data flow. 2:40 — stop. Do not demo missing features.</p>
                  </div>
                )}
                {liveTab === "analysis" && (
                  <pre className="code-mini" style={{ borderRadius: 10 }}>{`{
  `}<b>"stack"</b>{`: [`}<span className="k">"framework"</span>{`, `}<span className="k">"runtime"</span>{`, `}<span className="k">"data layer"</span>{`],
  `}<b>"tables"</b>{`: `}<span className="k">"detected from source"</span>{`,
  `}<b>"routes"</b>{`: `}<span className="k">"detected from source"</span>{`,
  `}<b>"modules"</b>{`: `}<span className="k">"detected from source"</span>{`,
  `}<b>"gaps"</b>{`: `}<span className="k">"omitted, not invented"</span>{`
}`}</pre>
                )}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="wrap section" id="examples">
        <Reveal>
          <div className="section-head center">
            <div className="kicker">The difference</div>
            <h2>Stop rebuilding your submission from scratch</h2>
          </div>
        </Reveal>
        <Reveal delay={1}>
          <div className="compare">
            <div className="card">
              <h3><span className="dot"><CrossIcon /></span> Without ProjectBuddy</h3>
              <ul className="minus">
                <li>Find templates</li>
                <li>Rewrite project details</li>
                <li>Draw diagrams manually</li>
                <li>Prepare slides at 2 AM</li>
                <li>Guess viva questions</li>
                <li>Fix everything last minute</li>
              </ul>
            </div>
            <div className="card good">
              <h3><span className="dot"><CheckIcon size={13} /></span> With ProjectBuddy</h3>
              <ul className="plus">
                <li>Upload your project</li>
                <li>Analyze the real repository</li>
                <li>Generate the diagrams</li>
                <li>Generate the presentation</li>
                <li>Generate the report</li>
                <li>Prepare viva, then export</li>
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="wrap section" id="faq">
        <Reveal>
          <div className="section-head center">
            <div className="kicker">FAQ</div>
            <h2>Frequently asked questions</h2>
            <p>Everything you need to know.</p>
          </div>
        </Reveal>
        <Reveal delay={1}>
          <div className="faq">
            <div className="faq-col">
              {FAQS_LEFT.map(([q, a], i) => (
                <FaqItem key={q} q={q} a={a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
              ))}
            </div>
            <div className="faq-col">
              {FAQS_RIGHT.map(([q, a], i) => (
                <FaqItem key={q} q={q} a={a} open={openFaq === i + 4} onToggle={() => setOpenFaq(openFaq === i + 4 ? -1 : i + 4)} />
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      <section className="wrap section tight">
        <Reveal>
          <div className="cta-band">
            <div>
              <h2>Your code is done. <em>Finish the submission.</em></h2>
              <p>Upload your project and get a complete, evidence-backed pack in minutes.</p>
            </div>
            <a className="btn primary lg" href="#start" onClick={onCreateProject}>Create Project Now <ArrowIcon /></a>
          </div>
        </Reveal>
      </section>

      <footer className="foot">
        <div className="wrap foot-grid">
          <div>
            <div className="brand"><div className="mark">P</div> ProjectBuddy</div>
            <p>Turn finished code into submission-ready material grounded in your source.</p>
          </div>
          <div>
            <h4>Product</h4>
            <a href="#how">How it works</a>
            <a href="#pack">What's included</a>
            <a href="#diagrams">Diagrams</a>
            <a href="#faq">FAQ</a>
          </div>
          <div>
            <h4>Resources</h4>
            <a href="#faq">Documentation</a>
            <a href="#faq">Student guide</a>
            <a href="#faq">Supported stacks</a>
            <a href="#faq">Tips &amp; tricks</a>
          </div>
        </div>
        <div className="wrap foot-bottom">
          <span>© 2026 ProjectBuddy. All rights reserved.</span>
          <span className="socials">
            <a href="https://github.com/MadinBloch/ProjectBuddy-" target="_blank" rel="noreferrer" aria-label="GitHub"><GitHubIcon /></a>
            <span aria-hidden><LinkedInIcon /></span>
            <span aria-hidden><XIcon /></span>
          </span>
        </div>
      </footer>
    </main>
  );
}

function Reveal({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`reveal ${className}`} data-delay={delay}>
      {children}
    </div>
  );
}

function PackCard({ icon, tone, title, tab, onGo, preview, points }) {
  return (
    <article className="out-card">
      <div className="head">
        <div className={`ico ${tone}`}>{icon}</div>
        <h3>{title}</h3>
      </div>
      <div className="preview">{preview}</div>
      <ul>{points.map((p) => <li key={p}>{p}</li>)}</ul>
      <button className="more" type="button" onClick={() => onGo(tab)}>
        View example <ArrowIcon />
      </button>
    </article>
  );
}

function FaqItem({ q, a, open, onToggle }) {
  return (
    <button type="button" className={`faq-item ${open ? "open" : ""}`} onClick={onToggle}>
      <div className="faq-q">{q}<span className="pm">+</span></div>
      {open && <p>{a}</p>}
    </button>
  );
}

function SlideView({ slide, index }) {
  return (
    <div className="deck-slide slide-anim">
      <div className="tag">{slide.tag} · {slide.title}</div>
      <h3>{slide.title}</h3>
      {slide.counter && <div className="counter">{slide.counter}</div>}
      {slide.chart ? (
        <div className="deck-bars">
          {[38, 62, 48, 80, 58, 92, 70].map((h, i) => (
            <i key={i} style={{ height: `${h}%`, animationDelay: `${0.08 * i}s` }} />
          ))}
        </div>
      ) : (
        <ul>{slide.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
      )}
    </div>
  );
}

function HeroWindow({ visible }) {
  const [counted, setCounted] = useState(false);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setCounted(true), 350);
    return () => clearTimeout(t);
  }, [visible]);

  const stats = [["Files", "Source files"], ["Routes", "Detected routes"], ["Tables", "Database tables"], ["Modules", "Project modules"]];
  return (
    <div className="window-wrap" style={{ position: "relative" }}>
      <div className="hero-chip float-a ok"><CheckIcon /> Scan Complete</div>
      <div className="hero-chip float-b"><SparkIcon /> AI analyzes your code</div>
      <div className="window">
        <div className="window-bar">
          <span className="dots"><i /><i /><i /></span>
          <span className="window-title">ProjectBuddy <span className="mono">/ studio</span></span>
          <span style={{ marginLeft: "auto", color: "var(--ok)", fontSize: 11, fontWeight: 600, display: "flex", gap: 5, alignItems: "center" }}>
            <CheckIcon size={12} /> Scan Complete
          </span>
        </div>
        <div className="window-body">
          <aside className="window-rail">
            <div className="rail-label">Overview</div>
            {[
              ["Report", <DocIcon key="a" />], ["Diagrams", <DiagramIcon key="b" />],
              ["Presentation", <DeckIcon key="c" />], ["Viva Q&A", <VivaIcon key="d" />],
              ["Demo Script", <PlayIcon key="e" />], ["Project Analysis", <CodeIcon key="f" />],
            ].map(([label, icon], i) => (
              <div key={label} className={`rail-item ${i === 0 ? "on" : ""}`}>{icon} {label} {i === 0 && <span className="tick"><CheckIcon size={12} /></span>}</div>
            ))}
            <div className="rail-label" style={{ marginTop: 8 }}>Files</div>
            <div className="rail-item"><CodeIcon /> index.html</div>
          </aside>
          <div className="window-main">
            <div className="doc-tag">Repository-driven analysis</div>
            <h3>Project Analysis</h3>
            <p className="muted sm" style={{ margin: 0, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <span><b style={{ color: "var(--ink-2)" }}>Framework</b></span>
              <span><b style={{ color: "var(--ink-2)" }}>Runtime</b></span>
              <span><b style={{ color: "var(--ink-2)" }}>Database</b></span>
            </p>
            <div className="stat-row">
              {stats.map(([n, l]) => (
                <div key={l}>
                  <strong>{counted ? n : "0"}</strong>
                  <span>{l}</span>
                </div>
              ))}
            </div>
            <div className="doc-lines">
              <div className="line accent w55" />
              <div className="line w100" />
              <div className="line w85" />
              <div className="line w40" />
            </div>
            <div className="mini-outs">
              {[
                ["Report", <DocIcon key="a" />], ["Diagrams", <DiagramIcon key="b" />],
                ["Presentation", <DeckIcon key="c" />], ["Viva Q&A", <VivaIcon key="d" />],
              ].map(([label, icon]) => (
                <span key={label}>{icon} {label}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArchMini({ large }) {
  return (
    <svg viewBox="0 0 460 240" className={large ? "svg-lg" : "svg-sm"} style={{ width: large ? "100%" : undefined }} aria-hidden="true">
      <defs>
        <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0 0 L8 4 L0 8 z" fill="var(--faint)" />
        </marker>
      </defs>
      <rect x="180" y="10" width="100" height="32" rx="8" fill="var(--surface)" stroke="var(--line-2)" />
      <text x="230" y="30" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink-2)">User</text>
      <rect x="180" y="70" width="100" height="32" rx="8" fill="var(--brand-soft)" stroke="var(--brand)" />
      <text x="230" y="90" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--brand-strong)">Frontend (React)</text>
      <rect x="160" y="130" width="140" height="32" rx="8" fill="var(--brand)" />
      <text x="230" y="150" textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff">API Server (Node.js)</text>
      <rect x="30" y="192" width="120" height="32" rx="8" fill="var(--brand-soft)" stroke="var(--brand)" />
      <text x="90" y="212" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--brand-strong)">Auth layer</text>
      <rect x="170" y="192" width="120" height="32" rx="8" fill="var(--surface)" stroke="var(--line-2)" />
      <text x="230" y="212" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--ink-2)">Controllers</text>
      <rect x="310" y="192" width="120" height="32" rx="8" fill="var(--surface)" stroke="var(--line-2)" />
      <text x="370" y="212" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--ink-2)">Models</text>
      <g>
        <ellipse cx="420" cy="120" rx="34" ry="12" fill="var(--surface)" stroke="var(--line-2)" />
        <path d="M386 120 v34 a34 12 0 0 0 68 0 v-34" fill="var(--surface)" stroke="var(--line-2)" />
        <text x="420" y="142" textAnchor="middle" fontSize="9" fill="var(--ink-2)">Database</text>
      </g>
      <path d="M230 42 V70 M230 102 V130" stroke="var(--faint)" markerEnd="url(#arr)" />
      <path d="M200 162 L110 192 M230 162 V192 M260 162 L340 192 M300 146 H386" stroke="var(--faint)" fill="none" markerEnd="url(#arr)" />
    </svg>
  );
}

function ErMini() {
  return (
    <svg viewBox="0 0 460 240" className="svg-lg" aria-hidden="true">
      {[
        ["users", 40, 40, ["id PK", "name", "email", "role"]],
        ["orders", 260, 40, ["id PK", "user_id FK", "total", "status"]],
        ["items", 260, 150, ["id PK", "order_id FK", "product", "qty"]],
      ].map(([name, x, y, cols]) => (
        <g key={name}>
          <rect x={x} y={y} width="150" height={30 + cols.length * 20} rx="9" fill="var(--surface)" stroke="var(--line-2)" />
          <rect x={x} y={y} width="150" height="28" rx="9" fill="var(--brand)" />
          <text x={x + 12} y={y + 19} fontSize="11" fontWeight="600" fill="#fff">{name}</text>
          {cols.map((c, i) => (
            <text key={c} x={x + 12} y={y + 46 + i * 19} fontSize="10" fill="var(--muted)">{c}</text>
          ))}
        </g>
      ))}
      <path d="M190 90 H260" stroke="var(--faint)" />
      <text x="225" y="84" textAnchor="middle" fontSize="9" fill="var(--faint)">1 : N</text>
      <path d="M335 118 V150" stroke="var(--faint)" />
      <text x="349" y="138" fontSize="9" fill="var(--faint)">1 : N</text>
    </svg>
  );
}

function UseCaseMini() {
  return (
    <svg viewBox="0 0 460 240" className="svg-lg" aria-hidden="true">
      <circle cx="60" cy="120" r="12" fill="none" stroke="var(--ink-2)" strokeWidth="2" />
      <path d="M60 132 V172 M42 146 H78 M60 172 L46 200 M60 172 L74 200" stroke="var(--ink-2)" strokeWidth="2" fill="none" />
      <text x="60" y="218" textAnchor="middle" fontSize="11" fill="var(--ink-2)">User</text>
      {[
        ["Browse menu", 200, 40], ["Place order", 200, 90],
        ["Track delivery", 200, 140], ["Review result", 200, 190],
      ].map(([label, x, y]) => (
        <g key={label}>
          <ellipse cx={x + 90} cy={y + 16} rx="92" ry="21" fill="var(--surface)" stroke="var(--brand)" />
          <text x={x + 90} y={y + 20} textAnchor="middle" fontSize="11" fill="var(--ink-2)">{label}</text>
          <path d="M78 122 L{x + 2} {y + 16}" stroke="var(--line-2)" />
        </g>
      ))}
      <path d="M76 120 L198 56 M76 126 L198 106 M76 130 L198 156 M76 136 L198 206" stroke="var(--line)" />
    </svg>
  );
}

function DfdMini({ level = 0 }) {
  return (
    <svg viewBox="0 0 460 240" className="svg-lg" aria-hidden="true">
      <circle cx="70" cy="120" r="26" fill="var(--brand-soft)" stroke="var(--brand)" />
      <text x="70" y="124" textAnchor="middle" fontSize="11" fill="var(--brand-strong)">User</text>
      <circle cx="230" cy="120" r="34" fill="var(--brand)" />
      <text x="230" y="118" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{level === 0 ? "Food" : "Place"}</text>
      <text x="230" y="130" textAnchor="middle" fontSize="10" fontWeight="700" fill="#fff">{level === 0 ? "System" : "Order"}</text>
      <g>
        <path d="M360 90 h70 v60 h-70 z" fill="var(--surface)" stroke="var(--warn)" strokeWidth="1.5" />
        <path d="M360 90 l14 14 h56" fill="none" stroke="var(--warn)" strokeWidth="1.5" />
        <text x="395" y="130" textAnchor="middle" fontSize="10" fill="var(--ink-2)">{level === 0 ? "Orders" : "Order DB"}</text>
      </g>
      <path d="M96 120 H196 M264 120 H360" stroke="var(--faint)" markerEnd="url(#arr)" />
      <text x="150" y="112" textAnchor="middle" fontSize="9" fill="var(--faint)">request</text>
      <text x="310" y="112" textAnchor="middle" fontSize="9" fill="var(--faint)">store</text>
    </svg>
  );
}

function SequenceMini() {
  return (
    <svg viewBox="0 0 460 240" className="svg-lg" aria-hidden="true">
      {[['Client', 70], ['API', 230], ['DB', 390]].map(([label, x]) => (
        <g key={label}>
          <rect x={x - 40} y="16" width="80" height="26" rx="7" fill="var(--surface)" stroke="var(--line-2)" />
          <text x={x} y="33" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink-2)">{label}</text>
          <path d={`M${x} 42 V220`} stroke="var(--line-2)" strokeDasharray="3 4" />
        </g>
      ))}
      <path d="M70 80 H230" stroke="var(--brand)" strokeWidth="2" markerEnd="url(#arr)" />
      <text x="150" y="72" textAnchor="middle" fontSize="9.5" fill="var(--muted)">POST /orders</text>
      <path d="M230 130 H390" stroke="var(--brand)" strokeWidth="2" markerEnd="url(#arr)" />
      <text x="310" y="122" textAnchor="middle" fontSize="9.5" fill="var(--muted)">insert()</text>
      <path d="M390 170 H70" stroke="var(--faint)" strokeDasharray="4 3" markerEnd="url(#arr)" />
      <text x="230" y="162" textAnchor="middle" fontSize="9.5" fill="var(--muted)">201 Created</text>
    </svg>
  );
}

function ActivityMini() {
  return (
    <svg viewBox="0 0 460 240" className="svg-lg" aria-hidden="true">
      <circle cx="230" cy="28" r="12" fill="var(--brand)" />
      <rect x="160" y="60" width="140" height="30" rx="15" fill="var(--surface)" stroke="var(--line-2)" />
      <text x="230" y="79" textAnchor="middle" fontSize="10.5" fill="var(--ink-2)">Login</text>
      <rect x="160" y="110" width="140" height="30" rx="4" fill="var(--surface)" stroke="var(--brand)" />
      <text x="230" y="129" textAnchor="middle" fontSize="10.5" fill="var(--ink-2)">Place order</text>
      <path d="M230 90 V110" stroke="var(--faint)" markerEnd="url(#arr)" />
      <rect x="150" y="160" width="160" height="30" rx="4" fill="var(--surface)" stroke="var(--line-2)" />
      <text x="230" y="179" textAnchor="middle" fontSize="10.5" fill="var(--ink-2)">Review result</text>
      <path d="M230 140 V160 M210 190 h-60 v-140 a10 10 0 0 1 10 -10 h40" stroke="var(--faint)" fill="none" markerEnd="url(#arr)" />
      <text x="120" y="140" fontSize="9.5" fill="var(--muted)">[retry]</text>
    </svg>
  );
}

function DeployMini() {
  return (
    <svg viewBox="0 0 460 240" className="svg-lg" aria-hidden="true">
      <rect x="30" y="40" width="400" height="160" rx="14" fill="var(--surface-2)" stroke="var(--line-2)" strokeDasharray="5 4" />
      <text x="230" y="66" textAnchor="middle" fontSize="11" fill="var(--muted)">Host environment</text>
      <rect x="70" y="90" width="150" height="40" rx="9" fill="var(--brand-soft)" stroke="var(--brand)" />
      <text x="145" y="114" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--brand-strong)">Web App (React)</text>
      <rect x="250" y="90" width="150" height="40" rx="9" fill="var(--surface)" stroke="var(--line-2)" />
      <text x="325" y="114" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink-2)">API (Node.js)</text>
      <g>
        <ellipse cx="230" cy="164" rx="40" ry="11" fill="var(--surface)" stroke="var(--warn)" />
        <path d="M190 164 v14 a40 11 0 0 0 80 0 v-14" fill="var(--surface)" stroke="var(--warn)" />
        <text x="230" y="180" textAnchor="middle" fontSize="9.5" fill="var(--ink-2)">Database</text>
      </g>
      <path d="M145 130 V150 H190 M325 130 V150 H270" stroke="var(--faint)" fill="none" markerEnd="url(#arr)" />
    </svg>
  );
}

function DiagramPreview({ kind }) {
  if (kind === "er") return <ErMini />;
  if (kind === "usecase") return <UseCaseMini />;
  if (kind === "dfd0") return <DfdMini level={0} />;
  if (kind === "dfd1") return <DfdMini level={1} />;
  if (kind === "sequence") return <SequenceMini />;
  if (kind === "activity") return <ActivityMini />;
  if (kind === "deployment") return <DeployMini />;
  return <ArchMini large />;
}

function svgProps(size = 16) {
  return {
    width: size, height: size, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: 1.8,
    strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true,
  };
}
function CheckIcon({ size }) { return <svg {...svgProps(size || 14)}><path d="M20 6 9 17l-5-5" /></svg>; }
function CrossIcon() { return <svg {...svgProps(12)}><path d="M18 6 6 18M6 6l12 12" /></svg>; }
function UploadIcon() { return <svg {...svgProps(16)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" /></svg>; }
function DownloadIcon() { return <svg {...svgProps(16)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" /></svg>; }
function GitHubIcon() { return <svg {...svgProps(16)} fill="currentColor" stroke="none"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" /></svg>; }
function DocIcon() { return <svg {...svgProps(16)}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M8 13h8M8 17h5" /></svg>; }
function DiagramIcon() { return <svg {...svgProps(15)}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /><path d="M10 6.5h7v7" /></svg>; }
function DeckIcon() { return <svg {...svgProps(16)}><rect x="2" y="4" width="20" height="13" rx="2" /><path d="M12 17v4M8 21h8" /></svg>; }
function VivaIcon() { return <svg {...svgProps(16)}><path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12Z" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.3" /><path d="M12 16.5h.01" /></svg>; }
function PlayIcon() { return <svg {...svgProps(16)}><circle cx="12" cy="12" r="9" /><path d="M10 8.5 16 12l-6 3.5Z" fill="currentColor" stroke="none" /></svg>; }
function CodeIcon() { return <svg {...svgProps(15)}><path d="m8 8-4 4 4 4M16 8l4 4-4 4" /></svg>; }
function SearchIcon() { return <svg {...svgProps(16)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4-4" /></svg>; }
function SparkIcon() { return <svg {...svgProps(15)}><path d="M12 3v3M12 18v3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M3 12h3M18 12h3M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /><circle cx="12" cy="12" r="3" /></svg>; }
function FolderIcon() { return <svg {...svgProps(24)}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h3l2 3h6A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5Z" /></svg>; }
function ArrowIcon() { return <svg {...svgProps(15)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
function ChevronLeft() { return <svg {...svgProps(15)}><path d="m15 18-6-6 6-6" /></svg>; }
function ChevronRight() { return <svg {...svgProps(15)}><path d="m9 18 6-6-6-6" /></svg>; }
function LinkedInIcon() { return <svg {...svgProps(15)} fill="currentColor" stroke="none"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z" /></svg>; }
function XIcon() { return <svg {...svgProps(14)} fill="currentColor" stroke="none"><path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3l13.31 17.41Z" /></svg>; }
