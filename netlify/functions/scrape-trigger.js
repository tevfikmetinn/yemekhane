// Netlify Scheduled Function
// Hafta içi TR 08:00–17:59 arası her 15 dakikada GitHub Actions scrape workflow'unu tetikler.
// Bu sayede GitHub schedule cron'unun tembel davranışı bypass edilir.

exports.handler = async () => {
  const token = process.env.GITHUB_TOKEN;
  const owner = "tevfikmetinn";
  const repo = "yemekhane";
  const workflow = "scrape.yml";

  if (!token) {
    console.error("GITHUB_TOKEN env var eksik");
    return { statusCode: 500, body: "GITHUB_TOKEN env var eksik" };
  }

  const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflow}/dispatches`;

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "netlify-yemekhane-trigger",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ref: "main" }),
    });

    // GitHub workflow_dispatch başarılıysa 204 No Content döner
    if (resp.status === 204) {
      const now = new Date().toISOString();
      console.log(`✓ Workflow tetiklendi @ ${now}`);
      return { statusCode: 200, body: `triggered @ ${now}` };
    } else {
      const txt = await resp.text();
      console.error(`✗ GitHub API hatası ${resp.status}: ${txt}`);
      return { statusCode: 500, body: `github ${resp.status}: ${txt}` };
    }
  } catch (err) {
    console.error("fetch hatası:", err);
    return { statusCode: 500, body: `error: ${err.message}` };
  }
};

// Schedule: hafta içi TR 08:00–17:59 her 15 dk (UTC 5-14)
exports.config = {
  schedule: "*/15 5-14 * * 1-5",
};
