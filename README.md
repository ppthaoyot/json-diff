# JSON Diff Workshop

Multi-page utility workshop for JSON comparison, Base64 conversion, Thai ID test data, lucky draw, and the Office Dino mini game.

## Page structure

- `pages/index.html`
  SEO-first landing page and the main navigation entry for the new structure.
- `pages/json-diff.html`
  Standalone JSON diff workspace with side-by-side, tree, and list views.
- `pages/base64-encode.html`
  Standalone Base64 encode page with UTF-8 support and file loading.
- `pages/base64-decode.html`
  Standalone Base64 decode page with text output and image preview support.
- `pages/thai-id.html`
  Standalone Thai ID generator and checksum validator for QA and test data.
- `pages/lucky.html`
  Standalone lucky draw page with 2-digit, 3-digit, and 6-digit modes.
- `pages/office-dino.html`
  Standalone Office Dino page with player naming, fallback names, and top 100 leaderboard.
- `index.html`
  Legacy all-in-one tabbed page kept for backward compatibility and quick local use.

## Open the project

1. Open `pages/index.html` when you want the new SEO-friendly multi-page structure.
2. Open `index.html` when you want the original legacy all-in-one page.
3. Open any page directly under `pages/` if you need a single tool in standalone mode.

## Assets

- `assets/css/base.css`
  Base tokens and shared resets.
- `assets/css/layout.css`
  Shared layout primitives.
- `assets/css/components.css`
  Shared components such as toast and leaderboard list defaults.
- `assets/css/pages/home.css`
  Landing page styling.
- `assets/css/pages/tools.css`
  Shared styling for standalone tool pages.
- `assets/css/pages/office-dino.css`
  Dedicated styling for the Office Dino page.
- `assets/js/shared/ui.js`
  Shared escaping, toast, and clipboard helper behavior.
- `assets/js/shared/storage.js`
  Shared leaderboard storage and funny default player names for Office Dino.
- `assets/js/pages/`
  Page-specific JavaScript files for each standalone tool and mini game.

## SEO foundation

Each standalone page under `pages/` includes:

- A page-specific `<title>`
- `meta description`
- `canonical`
- `og:title`
- `og:description`
- Semantic page sections and internal links

Project-wide SEO support files:

- `robots.txt`
- `sitemap.xml`

## Tests

Run the current automated checks with:

```bash
node --test tests/dino-buffs.test.js tests/leaderboard.test.js tests/office-dino-page.test.js tests/multipage-smoke.test.js
```

## Notes

- No backend is used in this round.
- Office Dino leaderboard data still uses `localStorage`.
- The new landing page is `pages/index.html`.
- The original `index.html` remains the legacy interface by design.
