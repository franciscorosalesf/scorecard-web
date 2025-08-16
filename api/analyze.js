// api/analyze.js  (Vercel Serverless Function - Node.js)
// api/analyze.js  — verbose, no SDK
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { transcript } = req.body || {};
    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({ error: "Missing transcript" });
    }

    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return res.status(500).json({ error: "OPENAI_API_KEY is missing on the server" });
    }

    const SYSTEM = `You are CoachAI Analyzer. Output EXACTLY one JSON object that matches this shape:
{
  "overall_score_0_100": number,
  "overall_confidence": "Low"|"Medium"|"High",
  "competencies": {
    "ethics": {"score_1_5":number,"confidence":string,"evidence":string[]},
    "mindset": {"score_1_5":number,"confidence":string,"evidence":string[]},
    "agreements": {"score_1_5":number,"confidence":string,"evidence":string[]},
    "trust_safety": {"score_1_5":number,"confidence":string,"evidence":string[]},
    "presence": {"score_1_5":number,"confidence":string,"evidence":string[]},
    "active_listening": {"score_1_5":number,"confidence":string,"evidence":string[]},
    "evokes_awareness": {"score_1_5":number,"confidence":string,"evidence":string[]},
    "facilitates_growth": {"score_1_5":number,"confidence":string,"evidence":string[]}
  },
  "most_used_competencies": string[],
  "least_used_competencies": string[],
  "strengths_summary": string,
  "growth_areas_summary": string,
  "action_items": [{"title":string,"why_it_matters":string,"practice_drill":string}],
  "metrics": {
    "est_coach_talk_ratio": string,
    "question_vs_statement_ratio": string,
    "open_vs_closed_questions": string,
    "method": string,
    "confidence": "Low"|"Medium"|"High",
    "notable_patterns": string[]
  },
  "flags": {"ethical_concerns":string[],"confidentiality_risks":string[],"notes":string[]},
  "disclaimer": string
}
Rules (brief):
- Evidence must be unique COACH quotes (≤12 words).
- Map: confidentiality→ethics; autonomy/validation→trust_safety; reflections→active_listening;
  assumptions/options→evokes_awareness; action/timeline/obstacles/supports→facilitates_growth;
  presence requires non-question partnering; agreements needs outcome (+ success measure/revisit for ≥4).
- Mindset ≤3 unless explicit self-management/learning is quoted. Presence ≤3 unless partnering is quoted.
- FG=5 only if action + obstacles + supports present.
- overall_score_0_100 = round((sum of eight scores)/40*100).`;

    const body = {
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Analyze the following transcript. Return only the JSON object.\n\n${transcript}` }
      ]
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify(body)
    });

    const raw = await r.text();
    if (!r.ok) {
      return res.status(500).json({ error: "OpenAI error", status: r.status, detail: raw });
    }

    let dataText;
    try { dataText = JSON.parse(raw).choices?.[0]?.message?.content || "{}"; }
    catch { return res.status(500).json({ error: "Unexpected OpenAI response", raw }); }

    let data;
    try { data = JSON.parse(dataText); }
    catch { return res.status(500).json({ error: "Bad JSON from model", raw: dataText }); }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e) });
  }
}
