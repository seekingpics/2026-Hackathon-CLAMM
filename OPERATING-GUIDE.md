# RPM Roadworks Lab — Operating guide

English client demonstration · Melbourne, Victoria · 29 September 2026

## Start here

Open Home and select a worksite. The main navigation contains Home, Worker safety, Work-zone planning, and Evidence & report. The four segments of the circle open the corresponding worker safety area. The selected worksite and its session records are retained while you move between pages.

Choose Start guided demo for a five-step walkthrough. The guide stays above the workspace so you can operate the page. Use Next step, Previous, or Exit guide at any time. If you explore another screen, Return to this step restores the guide’s current area. The guide does not erase existing records.

For a shorter presentation, use a Home scenario card:

- Vehicle approach starts a moving replay. The watch alert arrives only when the vehicle reaches the marked trigger area.
- Worker SOS opens Workers & support and creates a simulated SOS for the selected worker.
- Extended duty opens Workers & support, sets the selected worker to 180 minutes of continuous work and produces a demonstration reminder.

The three shortcuts use your selected site and worker. Previous events remain until reviewed and closed. Reloading the page starts a fresh session; export evidence before reloading.

## 01 · On-site protection

Select Normal vehicle passing, Vehicle approaching workers, Simulated speeding, Vehicle entering restricted zone, or Pedestrian entering restricted zone. Selecting a scenario resets the replay to zero and starts movement. Normal passage does not generate a hazard. Other scenarios notify the watch when the moving object reaches the relevant trigger area.

Use Pause, Play, Replay or the timeline to inspect the scene. The Apple Watch-style device automatically displays a delivered alert. Press Acknowledge alert on the watch to record receipt. Acknowledgement does not clear the hazard or close its event. SOS and Request break are also operated on the watch.

Local events show the event ID, original configuration, notification result, owner and response stage. Assign supervisor, then Start response. After the observation is restored and the condition is cleared, Review & close is available. Mark hazard condition cleared returns the scenario to normal but keeps the event pending review.

Open Connectivity checks & local alert path to simulate equipment failure, obstruction or a disconnected wearable. These differ from Simulate internet outage: loss of the internet retains local processing in the demo but freezes the supervisor’s cloud copy. Restore internet synchronises the same event IDs. There is no durable offline storage or physical device connection.

Queue warnings appears as supporting context below the safety workspace. It uses a separate model clock and sends no watch notifications. Open queue warnings to inspect its model.

## 02 · Workers & support

Choose Worker and Worker scenario. Normal shift, High heart rate, Extended continuous work, SOS / urgent help, and Break requested change the selected worker’s simulated condition. The watch displays their name, heart rate, continuous-duty time and status. Battery and heart-rate data quality are not manual controls on this page.

Workers on site lists every worker. Red indicates an open SOS; amber indicates a support request or a condition awaiting review. View watch changes the selected worker. Each worker retains independent readings, requests and response history.

In Support for the selected worker, use Assign supervisor, Arrange support, then Complete support / handover. Complete every outstanding request’s arrangement first. Completion closes that worker’s support requests and resets only their continuous-duty counter. Switching back to Normal shift changes readings but does not silently close existing requests.

Weather demo has one selector: Clear conditions, Hot day, Rain, Low visibility or Strong wind. It applies to the selected site. Hot day can create support reminders for workers with at least 90 minutes of continuous duty. Rain, low visibility and wind create environmental advisories with corresponding checks. Changing to clear conditions does not erase the earlier event history. All weather and physiological readings are simulated; the thresholds are demonstration rules, not medical advice or approved rest schedules.

## 03 · Site layout

Start with Warning-sign worker: proposed standing position. This refers to the worker holding a warning sign. Review the traffic approach, sight line, escape arrangement and any hold condition. The diagram is a conceptual layout, not a measured position on the real road. Obstructions, an escape route across traffic or an incompatible approach can require review.

Below it, compare Straight road and Corner road, select the main traffic approach, worker zone and escape location, and adjust assumed device position, detection range, alert lead time and physical separation. These are separate parameters. Add corner / blind-spot devices to demonstrate extra coverage. Site power and local communications remain required for the simulated alert path.

Configuration checks lists remaining gaps. Confirm demo configuration is available after those checks pass and a valid expiry date/time is entered. Changing the layout creates a new revision and removes confirmation. Zero gaps and Demo confirmed do not certify a safe site. The expiry is recorded but not automatically enforced. Existing events keep their original trigger configuration.

Official road context is collapsed by default on this page. Open it to inspect SCATS historical detector counts and Vicmap road geometry. The packaged traffic date is 27 September 2026, with 96 quarter-hour intervals. Select a detector and time interval. Missing values stay unavailable, not zero. Counts are detector activations, not a junction-wide count of unique vehicles. Refresh roads refreshes the Vicmap layer only; it does not import a new SCATS date. Failed refreshes retain saved geometry and show its status.


## 04 · Multi-site supervision

Review Cremorne, Richmond and Southbank, their open events and data status. Simulate requests at other sites creates demonstration requests elsewhere. Open site or Open response selects the relevant site. Process an event when its site is selected and its supervisor information is current.

Stale data identifies the last synchronised supervisor copy after an internet outage. Local events and responses remain in the session. Restore internet updates the existing event IDs. This is a simulated sync workflow within one browser, not a live multi-user service.

Fleet & charging below the dashboard provides equipment delivery context. A feasible modelled dispatch does not establish that equipment has arrived, that inventory is physically on site, or that work may begin.

## Queue warnings

Enter from On-site protection. The full supporting model is configured only for an illustrative Cremorne scenario. Richmond and Southbank show Not yet modelled. Explore Cremorne example lets you inspect that example while retaining the original selected worksite. Back to Worker safety restores the worksite and safety tab from which you entered.

Use Model scenario, Plan A/B, Play model, playback speed and Model replay. Its 08:00-based clock is independent of the worker safety replay. Inject demand surge demonstrates an increasing queue, changed virtual VMS text and a changed virtual speed sign. Disconnect sensor shows unknown readings and removes a speed command; planning estimates remain available.

The queue calculation is a constant-demand fluid model with 7 metres per equivalent vehicle. The 70/200 metre thresholds and 80/60/40 km/h virtual speeds are demonstration assumptions. SCATS historical data is context; it is not a live queue sensor. No roadside equipment is controlled and no queue event is delivered to a worker watch.

## Work-zone planning

Open Work-zone planning from the main navigation. Plan & simulate follows five steps shown across the top: choose location, configure the work zone, choose equipment, run the simulation and view the impact.

- Planned work zone: enter an address, start and end time, closure type (full, partial or shoulder), lanes affected and optional notes. Swan Street/Church Street Cremorne, Bridge Road Richmond and City Road Southbank addresses show real Vicmap roads; any other address shows a mock street map. The planned work zone is drawn in orange.
- Deployable equipment: pick a category tab (Signage, Electronic, Lighting, Barriers, Crash cushions, Other) and use − / + to set quantities. Tab badges show how many items are selected in each category.
- Run simulation shows six predicted impacts: congestion, queue length, travel delay, public transport, pedestrian impact and safety risk. If you change any setting afterwards, the results fade and ask you to run again.
- Saved plans: Save as Plan A, then Create alternative plan, change the closure or equipment and Save as Plan B (up to four plans). Click a plan to reload it. With two or more plans a comparison table highlights the lowest estimated impact per metric.
- Select for deployment: choose the plan you will deploy. It is marked with a green badge, and a short summary (location, time, closure, equipment, expected impact and the plans it was chosen over) appears in Evidence & report and in the JSON and CSV exports. If you edit that plan afterwards, the report keeps the version you selected until you select it again.

All predicted impacts are mock estimates from simple demonstration rules, not a traffic simulation. Plans last for the page session and do not change worker safety configurations.

Public works notices is now a section inside this tool. It remains available for all three sites, separately from the Cremorne-only planning model. Select the site at the top, enter start/end times and public advice, confirm the details, and choose Update map preview. Extend by 2 hours changes the draft and requires reconfirmation. Finish works removes the notice. This updates only the session map; it sends nothing to government systems, Google Maps or Waze. Public notices exclude worker identity, health and event information.

## Fleet & charging

Enter from Multi-site supervision. Inspect the original dispatch, EV reserve, job windows, payload limits and charging schedule. Find minimum adjustment searches zero-, one- and two-job reassignments. It prioritises fewer changes, then more electric kilometres within that bounded search. It does not relax the constraints. Restore original dispatch returns to the initial assignment.

Disable depot charger or edit the assumptions to explore infeasibility. The model includes one EV, two diesel vehicles, one depot charger and six fixed round trips. The five-year cost comparison uses independent annual mileage, purchase costs, energy, maintenance and year-five resale. Daily job reassignments do not silently change annual mileage. Costs are illustrative, undiscounted AUD; finance, tax and carbon costs are excluded. EVs are not assumed to be cheaper.

## Evidence & report

Review worker event history first: site, worker, trigger, delivery, acknowledgement, owner and response stage. Expand Trigger & history for the event audit. Open response returns to the relevant site and worker or supervisor page.

The separate supporting snapshots and model ledger describe the Cremorne example. Inspect a model event to view its recorded assumptions and replay it. Replaying a model event does not alter the worker safety layout or send a watch notification.

- Download scenario JSON saves the complete worksite state, worker audits, official-data provenance, current supporting models and both plan comparisons.
- Export event CSV saves worker and supporting-model events with readable function names.
- Print / save PDF prints the report. Expand any audit details you want to include before printing.

The export dialog also provides the full contents for browsers that do not save downloads. No automatic server record is kept. Export before reloading or closing the session.

## What is connected

Real context: packaged SCATS historical counts, official signal positions, and saved/refreshable Vicmap roads. The Site layout source panel includes source links, dates, status and attribution to the State of Victoria (DTP), CC BY 4.0.

Simulated: vehicle/pedestrian tracks, worker readings, weather, wearable alerts, connectivity, supervisor response, works notices, queues, planning and fleet results. There is no CCTV inference, connected Apple Watch, physical haptic/sound output, medical diagnosis, live queue detection or physical sign control. Road incident APIs and licensed weather feeds are not connected.

## Suggested three-minute presentation

1. Home: introduce the selected worksite and choose Start guided demo.
2. Watch the approach: play the vehicle, wait for the automatic notification and acknowledge on the watch.
3. Support the person: press SOS and follow the highlighted worker through assignment, assistance and completion.
4. Check the worksite: show the proposed warning-sign position, then briefly point out Work-zone planning.
5. Coordinate and record: show multi-site status and fleet context, then finish in Evidence & report and export.

Use the Extended duty Home shortcut for a quick alternative demonstration. Keep the main presentation on worker safety and open supporting tools only when they help explain a decision.
