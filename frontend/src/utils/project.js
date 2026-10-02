export function emptyAnswers() {
  return {
    studentName: "",
    enrollment: "",
    college: "",
    course: "BCA",
    guide: "",
    title: "",
    problem: "",
    futureWork: "",
    year: String(new Date().getFullYear()),
    modules: [],
  };
}

export function guessTitle(scan) {
  const m = scan?.modules?.[0] || "College Project";
  return m.replace(/ module$/i, "").replace(/ management$/i, "") + " System";
}

export function innerHtml(full) {
  if (!full) return "<p>Document is not ready.</p>";
  const match = String(full).match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return match ? match[1] : full;
}
