module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    return res.status(200).json({ ok: true, service: "CBC AOU Recruitment API" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, message: "Method not allowed." });
  }

  const upstream = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!upstream) {
    return res.status(503).json({ ok: false, message: "Recruitment backend is not configured yet." });
  }

  let target;
  try {
    target = new URL(upstream);
  } catch {
    return res.status(500).json({ ok: false, message: "Invalid backend configuration." });
  }

  if (target.protocol !== "https:" || target.hostname !== "script.google.com") {
    return res.status(500).json({ ok: false, message: "Unexpected backend host." });
  }

  const payload = req.body && typeof req.body === "object"
    ? req.body
    : (() => {
        try { return JSON.parse(req.body || "{}"); }
        catch { return null; }
      })();

  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ ok: false, message: "Invalid request body." });
  }

  // Honeypot: normal applicants never see or fill this.
  if (payload.website) {
    return res.status(200).json({ ok: true, application_id: "RECEIVED" });
  }

  try {
    const response = await fetch(upstream, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { ok: response.ok, message: response.ok ? "Application received." : "Upstream request failed." };
    }

    return res.status(response.ok ? 200 : 502).json(data);
  } catch (error) {
    console.error("Recruitment proxy error:", error);
    return res.status(502).json({ ok: false, message: "Could not reach the applications service." });
  }
};
