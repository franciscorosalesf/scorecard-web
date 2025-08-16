# CoachAI Scorecard Web (no-Next minimal)
- `index.html` — front-end UI (static)
- `api/analyze.js` — Vercel serverless function that calls OpenAI (JSON mode)
- `package.json` — installs the OpenAI SDK

## Deploy on Vercel
1) Push this folder to a GitHub repo (or create the repo and drag/drop this folder in the web UI).
2) In Vercel → Add New Project → Import your repo → Settings → Environment Variables:
   - `OPENAI_API_KEY`
3) Deploy. Visit the URL, paste a transcript, click **Analyze**.

## Embed in WordPress/Divi
```html
<iframe src="https://YOUR-APP.vercel.app/" width="100%" height="1200" style="border:0;border-radius:16px;overflow:hidden" loading="lazy"></iframe>
```

## Notes
- Keep API keys server-side (Vercel env vars).
- For ConvertKit email gate later, add another function `api/subscribe.js` and a small form.
