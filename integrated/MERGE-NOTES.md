# Team merge notes

## Merge base

Use the Matt snapshot as the code base because it contains the current R1 interaction model, Road User Notification, live demo, layout console and navigation map.

## Integrated features

### Matt
Retained as the primary implementation for shared R1 files and UI:
- `dist/home.mjs`
- `dist/safety.mjs`
- `dist/on-site-display.mjs`
- `dist/layout-console.mjs`
- `dist/live-demo.mjs` / `dist/live-demo.css`
- `dist/navigation-map.mjs`
- `dist/area-nav.css`

### Charles
Merged the independent Evidence & Report feature without replacing the newer R1 UI:
- `dist/evidence-report.mjs`
- `dist/evidence-report.css`
- report filter/selection handlers in `dist/app.js`
- `tests/evidence-report.test.mjs`

The dedicated Charles full-page navigation shell was not copied because it conflicts with the current Matt navigation. The report content itself is retained.

### Ash
Merged the independent Work-zone planning feature without replacing Worker safety:
- `dist/work-zone.mjs`
- `dist/work-zone.css`
- Work-zone map support in `dist/government-data.mjs`
- Work-zone routing/actions in `dist/app.js`
- `tests/work-zone.test.mjs`

The existing Public works notices are retained under Work-zone planning as a second tab.

## Files that must be manually merged in Git

Do not accept an entire side for these files:
- `dist/app.js`
- `dist/index.html`
- `dist/connected-context.mjs`
- `dist/government-data.mjs`

For shared R1 files (`safety.mjs`, `safety-model.mjs`, `home.mjs`, `on-site-display.mjs`, `worker-support.mjs`, shared CSS), keep the Matt/current implementation unless a specific newer behaviour from another branch is deliberately chosen. Copying the Charles or Ash snapshot wholesale would remove current live-demo/layout/navigation behaviour.

## Validation

`npm test` on the integrated build: 70 tests, 70 pass, 0 fail.

## Recommended Git merge order

1. Start from the current shared/demo branch.
2. Merge/cherry-pick Matt first.
3. Bring Charles Evidence & Report as feature-level changes, not whole-file replacements of shared R1 files.
4. Bring Ash Work-zone planning as feature-level changes.
5. Resolve `app.js`, `index.html`, `connected-context.mjs`, and `government-data.mjs` using this integrated build as the reference.
6. Run `npm test` before pushing.
