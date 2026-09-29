# RPM Roadworks Lab

A worker safety demonstrator for an Australian client. The English interface focuses on traffic controllers, with smaller links to queue warnings, work-zone planning and equipment fleet feasibility.

## Run locally

Run `node server.mjs` and open http://127.0.0.1:5173/. The existing Start-Demo.cmd launcher is also available. No dependency installation is required. Use a web server rather than opening index.html directly.

## Present the demo

Home provides circular navigation, Start guided demo, and Vehicle approach / Worker SOS / Extended duty shortcuts. The primary navigation contains Home, Worker safety, Work-zone planning, Evidence & report. Full instructions are in [OPERATING-GUIDE.md](OPERATING-GUIDE.md), also served at /operating-guide.html.

Worker safety has four areas: On-site protection, Workers & support, Site layout, Multi-site supervision. Work-zone planning is its own page for planning and simulating a work zone (location → work zone → equipment → simulation → predicted impacts, with saved plan comparison). Its impacts are mock estimates.

## Model boundaries

- Worker safety has independent worksite configurations, clocks and events. Moving objects trigger alerts by position, before acknowledgement.
- Queue warnings uses a separate model clock. It does not send wearable alerts. SCATS historical counts do not drive live queue detection.
- Work-zone planning estimates are mock demonstration rules. They do not affect worker placement, site configuration approval, or the queue and fleet models.
- Fleet feasibility does not confirm arrival or site readiness. Five-year costs use independent annual mileage.
- Supporting models are an illustrative Cremorne example. Richmond and Southbank show unmodelled states; their worker safety remains available.
- Official SCATS and Vicmap context is real; operations, workers, weather and devices are simulated. Source details: [R1-DATA-SOURCES.md](R1-DATA-SOURCES.md).
- Records last for the page session. Export JSON/CSV before reloading. No physical equipment, live CCTV or Apple Watch hardware is connected.

## Structure

- dist/app.js: routing, guided demo, state and exports.
- dist/home.mjs / workspace.css: landing page and shared presentation.
- dist/connected-context.mjs: scoped supporting summaries and evidence report.
- dist/safety*.mjs / worker-support.mjs / on-site-display.mjs: worker safety behaviours.
- dist/work-zone.mjs / work-zone.css: Work-zone planning · Plan & simulate.
- dist/model.mjs / views.mjs: existing queue, fleet and cost models.
- dist/government-data.mjs / data/: official context and saved fallback data.

## Validate

Run each directly (also works in environments that restrict test-runner subprocesses):

`node tests/model.test.mjs`

`node tests/safety.test.mjs`

`node tests/real-data-and-alerts.test.mjs`

`node tests/worker-support.test.mjs`

`node tests/workspace.test.mjs`

46 checks cover existing model invariants, moving alerts, worker isolation, data provenance, tool scope and report integration.

Legacy module identifiers remain inside model data for compatibility. The interface and CSV use functional names. Optional WebMCP tools read the complete scenario or configure the Cremorne supporting model; ordinary browsers can use all screens without WebMCP.

The supplied RPM Hire logo is retained unchanged.
