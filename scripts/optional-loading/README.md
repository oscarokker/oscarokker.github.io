# Optional-loading evidence

Reproduce the idle vs first-open boundaries for YouTube playback and the expanded Ghostlink shell.

```bash
npm ci
npm run build
node scripts/optional-loading/analyze-bundles.mjs out changed
npm install --no-save playwright
npx playwright install chromium
node scripts/optional-loading/playwright-network.mjs
node scripts/optional-loading/playwright-youtube-player.mjs
npm run test:optional-loading
```

JSON and screenshots land in `scripts/optional-loading/evidence/`. See `evidence/SUMMARY.md`.

Playwright is not a production dependency. Some YouTube scenarios stub `iframe_api` after abort/delay; those prove request boundaries, not real YouTube media playback.
