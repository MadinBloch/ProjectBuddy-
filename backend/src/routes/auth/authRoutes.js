export function registerAuthRoutes(app, deps) {
  const {
    buildGithubAuthorizeUrl,
    exchangeGithubCode,
    fetchGithubProfile,
    fetchGithubUserRepos,
    serialiseSessionUser,
    upsertUserFromProvider,
    frontendUrl,
    githubClientId,
    githubClientSecret,
  } = deps;

  app.get("/api/auth/github", (_req, res) => {
    if (!githubClientId || !githubClientSecret) {
      return res.status(500).json({ ok: false, error: "GitHub OAuth is not configured." });
    }
    res.redirect(buildGithubAuthorizeUrl());
  });

  app.get("/api/auth/github/callback", async (req, res) => {
    const code = String(req.query.code || "");
    if (!code) {
      return res.redirect(`${frontendUrl}/?auth_error=github_denied`);
    }

    try {
      const token = await exchangeGithubCode(code);
      const profile = await fetchGithubProfile(token);
      const user = await upsertUserFromProvider({
        provider: "github",
        providerUserId: String(profile.id),
        email: profile.email || null,
        name: profile.name || profile.login || "GitHub User",
        avatarUrl: profile.avatar_url || null,
      });

      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        accessToken: token,
      };

      req.session.save(() => {
        res.redirect(frontendUrl);
      });
    } catch (error) {
      res.redirect(`${frontendUrl}/?auth_error=${encodeURIComponent(error.message || "github_failed")}`);
    }
  });

  app.get("/api/auth/session", (req, res) => {
    res.json({ authenticated: !!req.session.user, user: serialiseSessionUser(req.session.user) });
  });

  app.get("/api/auth/user/repos", async (req, res) => {
    if (!req.session.user?.accessToken) {
      return res.status(401).json({ error: "Sign in with GitHub first." });
    }

    try {
      const repos = await fetchGithubUserRepos(req.session.user.accessToken);
      res.json({ repos });
    } catch (error) {
      res.status(400).json({ error: error.message || "Could not load repositories." });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ ok: false, error: "Logout failed." });
      }
      res.clearCookie("connect.sid");
      res.json({ ok: true });
    });
  });
}
