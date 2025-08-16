// api/analyze.js  (Vercel Serverless Function - Node.js)
import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
Rules:
- Evidence must be unique coach quotes (≤12 words), not client lines.
- Route autonomy/validation to trust_safety; confidentiality to ethics; reflections to active_listening; questions on assumptions/options to evokes_awareness; actions/timeline/obstacles/supports to facilitates_growth; presence uses non-question partnering only; agreements requires outcome (+ success measure/revisit for ≥4).
- Mindset ≤3 unless explicit self-management/learning is quoted. Presence ≤3 unless non-question partnering is quoted. FG=5 requires action + obstacles + supports.
- Metrics are strings as in the example above. If coach_utterances < 10 set overall_confidence="Low"; otherwise use metrics.confidence.
- Set overall_score_0_100 = round((sum of the eight 1–5 scores)/40*100).`;

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
    const prompt = `Analyze the following transcript. Return only the JSON object.\n\n${transcript}`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: prompt }
      ]
    });

    const text = completion.choices?.[0]?.message?.content || "{}";
    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(500).json({ error: "Bad JSON from model" }); }

    return res.status(200).json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
