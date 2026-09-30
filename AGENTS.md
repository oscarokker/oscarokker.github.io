<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

- Use Node.js 22 and `npm ci`, matching `.github/workflows/pages.yml`. `npm ci` is safe to run again.
- Start the site with `npm run dev` (webpack). It serves http://localhost:3000. Turbopack (`next dev` without `--webpack`) fails to compile `@strudel/web` (`Can't resolve <dynamic>` on the SharedWorker clock). Production builds already use webpack (`npm run build`).
- `npm run build` writes a static export to `out/`. Generating `/api/duolingo.json` fetches `https://www.duolingo.com` during the build.
- Leave `NEXT_PUBLIC_BASE_PATH` unset locally so routes stay at `/`. GitHub Pages sets it in CI.
- `npm run lint` executes, and the current source reports existing `react-hooks` errors. There is no automated test suite.
- A working check is the portfolio in the browser: the Work filter, opening the CheapVoyage case study, and the theme toggle.
