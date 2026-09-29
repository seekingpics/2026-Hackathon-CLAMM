# R1 public-data integration

Updated 29 September 2026.

## Connected sources

SCATS data in dist/data/scats.json is a **published historical snapshot from 27 September 2026**, downloaded on 29 September. There are 96 quarter-hour intervals for each of 24 detectors at three intersections. Exact official inventory matches: CR = 4808 CHURCH/SWAN; RI = 4801 BRIDGE/CHURCH; SO = 4881 CITY/POWER.

Vicmap Transport supplies anonymous GeoJSON within 400 m of each reference junction. The browser refreshes this road layer when the page loads or **Refresh roads** is pressed. Failed refreshes retain a saved layer marked unavailable/stale. No credential is embedded.

Roads and reference coordinates are real. Worksites, worker states, moving-object scenarios and weather remain simulated. Road centrelines cannot establish lane widths, work-zone boundaries or safe worker separation.

## Quality and attribution

SCATS metadata preserves source/resource/download URLs, AEST timezone, retrieval time, source archive and inventory SHA-256 hashes, and CC BY 4.0 attribution. Counts are individual detector activations; never sum them as unique vehicles. Detector-to-lane/direction mappings are unverified.

Cremorne detector 12 contains four unavailable intervals at 07:45–08:45 AEST, represented as null and marked red in the chart. Published zero series remain zero but do not establish an empty road or healthy device. All 71 complete detector series match the published daily totals.

Vicmap provenance is in dist/data/vicmap-manifest.json. Full intersecting lines are clipped to the map viewport. Source and State of Victoria (DTP), CC BY 4.0 attribution remain visible. Chart times use AEST; retrieval times display in Australia/Melbourne.

## Refresh limits

**Refresh roads only updates Vicmap.** SCATS requires a new validated import and publication to change the historical date. There is no scheduled SCATS updater. The original 116 MiB ZIP, selected raw rows and extraction script were processing artefacts in the original parent workspace; they are not included in this repository and are not required to run the demo. The repository includes the processed SCATS snapshot at `dist/data/scats.json`, the three saved Vicmap GeoJSON layers in `dist/data/`, and provenance at `dist/data/vicmap-manifest.json`. The snapshot metadata and source links below identify the official inputs. The large ZIP is not shipped to browsers.

Planned and Unplanned Disruptions remain disconnected pending a Transport Victoria API key and server-side secret/proxy. BOM remains simulated pending suitable client licensing.

## Automatic watch alerts

Selecting a scenario starts at zero. The renderer and detector share moving-object coordinates and trigger rectangles. Reaching the marked area creates an event and automatically notifies the Apple Watch-style screen. **Acknowledge alert**, **SOS** and **Request break** are on the watch. Acknowledgement records receipt without clearing risk.

A repeated approach resends under the existing open event ID and resets receipt acknowledgement. A passed, unread alert remains visible until acknowledged; a new replay does not reuse the old receipt. Watch sound and haptics remain simulated; no physical Apple Watch is connected. Government data does not drive these triggers.

## Sources

- [Traffic Signal Volume Data](https://opendata.transport.vic.gov.au/dataset/traffic-signal-volume-data)
- [Victorian Traffic Signals](https://opendata.transport.vic.gov.au/dataset/victorian-traffic-signals)
- [Vicmap Road Line](https://discover.data.vic.gov.au/dataset/vicmap-transport-road-line)
- [Planned Disruptions](https://opendata.transport.vic.gov.au/dataset/planned-disruptions-road)
- [Unplanned Disruptions](https://opendata.transport.vic.gov.au/dataset/unplanned-disruptions-road)

## Verification

Run node tests/model.test.mjs, node tests/safety.test.mjs and node tests/real-data-and-alerts.test.mjs.

Coverage includes trajectory-triggered delivery, no alarm on selection, normal passage, failed wearable delivery, re-entry, unread receipts, SCATS gaps/totals, WGS84 geometry and stale-layer recovery.

Official road context is consolidated in Worker safety → Site layout. On-site protection, Workers & support and Multi-site supervision do not repeat the context panel. Site layout also provides a conceptual warning-sign worker station and escape route, updated by the selected traffic approach. Obstructions, an escape route across traffic or a northern approach without a corner template show a review hold. This is not an approved field position.
