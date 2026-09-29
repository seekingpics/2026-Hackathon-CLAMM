# Verification record

## Pre-upload automated checks — 2026-09-29

All 46 checks passed by running the five test files directly:

- `node tests/model.test.mjs` — 15 passed.
- `node tests/safety.test.mjs` — 14 passed.
- `node tests/real-data-and-alerts.test.mjs` — 9 passed.
- `node tests/worker-support.test.mjs` — 4 passed.
- `node tests/workspace.test.mjs` — 4 passed.

The combined command `node --test tests/*.test.mjs` was blocked by the execution sandbox with a subprocess spawn `EPERM` error. Direct execution of each file completed successfully in that environment.

Source inspection confirms the current navigation: Home, Worker safety, Work-zone planning and Evidence & report. Worker safety has On-site protection, Workers & support, Site layout and Multi-site supervision tabs. Work-zone planning is a standalone page containing Public works notices; supporting routes provide Queue warnings and Fleet & charging. This inspection and the automated checks do not constitute a new browser verification.

## Earlier browser verification — 2026-09-29

The following record describes earlier checks with the local static server and Codex in-app browser. Its six-module navigation and R1–R4 labels refer to the interface at the time; the current navigation is described above.

- 15 Node model tests passed. Command: `node --test --test-isolation=none tests/model.test.mjs`.
- Browser: all six module views rendered; no JavaScript errors in the inspected browser console.
- R1 synthetic approaching truck produced 2.6 s time to zone; loss of feed displayed Unknown; completed relief reset the duty counter to zero.
- R2 demand surge changed queue, virtual VMS and speed state together; playback and pause controls operated.
- R3 Plan B changed barrier inventory to 26 / 44 and barrier payload to 9,880 kg. Closing the pedestrian link showed disconnected routes for both plans.
- R4 search moved J3 from EV-01 to D-02, met constraints, and displayed charging evidence. Changing electricity cost from $0.25 to $0.20 changed the TCO outcome from higher to lower cost.
- Evidence dialog: acknowledgment changed receipt status without removing the active hazard. Replay restored the recorded scenario.
- JSON export was generated and parsed from the export preview: simulated source, current version, both plan comparisons and captured events were present.
- Embedded-browser download notification could not be verified as an on-disk file. An export preview with complete selectable file contents is therefore included; regular browsers can download the Blob file normally.
- Guided demo steps 1 and 2 were exercised. Remaining steps reuse the individually verified module actions.
- Responsive desktop view rendered without document-level horizontal overflow. Narrow layout uses horizontally scrollable navigation.
- Optional WebMCP was not exposed by this browser; ordinary UI flows are independent of it.
- Source includes the supplied RPM Hire logo unchanged for both the sidebar and favicon. Its SHA-256 matches the original attachment. The earlier three-stripe placeholder was removed.
- The application retains a local launcher and supports GPT Sites static hosting; publication is tracked by the Site deployment status.

All verification is for a deterministic simulation prototype, not real road operation or measured safety effectiveness.
