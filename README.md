# Owen Sheetz engineering portfolio

Website: https://chromahud1.github.io/

Repository: https://github.com/chromaHUD1/chromaHUD1.github.io

## Make an update

1. Double-click `dist/Edit Website.cmd` to open the visual editor. You can also edit the source using Codex.
2. Click **Save website** in the editor. This updates the local pages in `dist`.
3. Double-click **Publish Website.cmd**, or run `./publish.ps1 -Message 'Describe your update'` in PowerShell.
4. Check the repository's **Actions** tab. When the Pages deployment is green, refresh the public website.

Normal Git commits and pushes to `main` also trigger deployment. The helper stages only current website pages, referenced assets, local editor files, and publishing tools. It never force-pushes.

## Structure

- `dist/index.html`: About homepage.
- `dist/projects.html` and `dist/project-*.html`: project listing and detail pages.
- `dist/editor*` and `dist/portfolio-*.js`: local editing tools and saved editing content.
- `editor_server.py` and `start-editor.ps1`: local-only editing and Save support.
- `tools/prepare_pages.py`: prepares a validated public copy in `.pages-build`.
- `.github/workflows/pages.yml`: builds and deploys the public copy using GitHub Pages.

Publication strips the private editing payload from the homepage, extracts embedded images and downloads, and includes only linked assets. It makes H.264 MP4 copies of referenced MOV videos, and removes photo location metadata without recompressing photo pixels. The original local files are preserved. The public deployment excludes the editor, helper server, logs, backups, tests, and unrelated documents.

Do not add passwords or API keys to project code or uploads: this is a public repository. Do not use `git add -f dist/Media/*`; use the publishing helper's referenced-file list instead.

## Local requirements

Python 3.11+, Git, and authenticated GitHub CLI. First-time dependencies: `python -m pip install -r requirements-publish.txt`. On another computer, clone this repository and sign in with `gh auth login`. GitHub Actions installs its own build dependency automatically.

## Visitor statistics

Private dashboard: https://owsheetz.goatcounter.com/ (sign in to view counts).

Exclude your own visits: open https://chromahud1.github.io/?exclude-visits=1 once in **each browser and phone** you use. Wait for the confirmation message. The preference persists across all project pages and future visits in that browser. Clearing site storage, changing browsers, or using a private window requires setting it again. To resume counting in that browser, open https://chromahud1.github.io/?exclude-visits=0.

Tracking is added by the publishing build, so editor saves preserve it and local previews never count. The dashboard stays private. Counts begin after installation; unique visitor totals are estimates and blockers can prevent counting. GoatCounter groups repeat visits into sessions of up to eight hours, rather than identifying people permanently. See [GoatCounter's session documentation](https://www.goatcounter.com/help/sessions).

The integration is `tools/site-analytics.js`; it contains a public site identifier, no password or API key. Publishing updates uses the same command above.

## Resume QR code

`portfolio-qr.png` and `portfolio-qr.svg` encode `https://chromahud1.github.io/` directly. They use no tracking service or expiring redirect. Use the SVG for vector printing or the high-resolution PNG; keep the white border intact. The QR remains valid while this GitHub Pages URL remains available.

To regenerate: install `qrcode[pil]` and `opencv-python`, then run `python tools/generate_qr.py`. That script independently decodes the PNG to confirm its URL. To check public links after deployment, run `python tools/verify_public.py`.

GitHub Pages is configured using the [official custom-workflow approach](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). No paid services or custom domain are required.
