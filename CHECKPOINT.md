# Marvel project checkpoint · 2026-10-09

The deployable edition is in `public/`, with the connected-world renderer in `public/world/`. Build output is `dist/`. Use the repository root, Other framework, and `npm run build` on Vercel. No runtime secrets or external artwork requests are required.

## Available work

- 13 connected landscapes, 55 full-body illustrated residents with 20-frame puppet loops, and 292 searchable character/variant records.
- The earlier illustrated edition is preserved at `/illustrated.html`.
- Full original artwork, source provenance, portrait atlas, and four generated landscape source images are preserved.
- Runtime fixes handle stale character selection, keyboard panning, stalled image timeouts, loader cleanup, and repainting paused or hidden scenes.
- `npm run check`, `npm test` (20 tests), and `npm run build` pass. The build checks 141 required runtime files.

## Continue later

The archived `work-in-progress/pixel-world/` contains the earlier pixel-world attempt. Its code is not the default deployed app. `work-in-progress/generated-assets/manifest.json` identifies the four generated source images and landscape crops.

Distinct character-specific action poses, expanded full-body coverage, consistent pixel character artwork, and richer environment interactions remain unfinished. Current animation uses puppet frames derived from existing illustrations. The approximate 154-character artwork batch mentioned in earlier conversation is not a verified count of completed assets in this checkout; inspect the manifests before resuming that production work.

Keep the available deployable edition working while extending artwork. Run the existing checks before publishing updates.
