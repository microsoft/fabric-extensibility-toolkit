# StreamMigrator demo video: recording script

**Goal:** show management how an Azure Stream Analytics job moves to a Fabric Eventstream in a few clicks.
**Length:** about 4 minutes. **Format:** 1920×1080 screen recording with voice-over.

## Before you record

- [ ] Dev mode is running: the dev server is on `localhost:60006` and the DevGateway log says `DevGateway started`. A dev registration lasts about 1–1.5 hours. After that the gateway logs `Relay listener went offline` and exits, so restart it right before recording.
- [ ] Fabric Developer Mode is **on** (⚙️ → Developer settings), and the page has been hard refreshed (Ctrl+F5).
- [ ] **Start from a clean workspace:** delete the earlier `DemoStreamAnalytics` Eventstream, or plan to use a new name. A re-run otherwise shows an "already migrated" warning.
- [ ] Delete old StreamMigrator items, or create a fresh one on camera.
- [ ] Data is flowing into the source Event Hub, so the Eventhouse shows rows at the end.
- [ ] The Eventhouse table exists, spelled exactly as you'll type it (case-sensitive).
- [ ] **Do a full dry run once.** It warms up first loads and catches surprises.
- [ ] Browser zoom at 100–110%. Bookmarks bar hidden. Notifications, chat apps and email closed.
- [ ] Tabs ready: (1) Azure portal on the ASA job, (2) the Fabric StreamShift workspace.

**Recording tools:** Clipchamp (built into Windows) or OBS. Record each scene as its own clip and join them afterwards; retakes are much easier.

## Scenes

| # | Time | On screen | Voice-over |
|---|---|---|---|
| 1 | 0:00–0:15 | Title card: *StreamShift: Azure Stream Analytics → Fabric in minutes* | "Moving streaming jobs from Azure Stream Analytics to Microsoft Fabric is manual today: recreating inputs, queries and outputs by hand. StreamShift automates it." |
| 2 | 0:15–0:40 | Azure portal: the ASA job → **Inputs** (Event Hub), **Query**, **Outputs** (ADX) | "Here's an existing Stream Analytics job. An Event Hub input, a SQL query, and an output to Data Explorer. This is what we'll migrate." |
| 3 | 0:40–0:55 | Fabric workspace → **+ New item** → **StreamMigrator** → create | "StreamShift runs natively inside Fabric as a workload. I create a StreamMigrator item right in the workspace." |
| 4 | 0:55–1:15 | **Select job**: subscription, then the job | "It lists the Stream Analytics jobs I can access in Azure, and I pick one." |
| 5 | 1:15–1:45 | **Assessment**: hover over mapped and approximated items | "Before anything is created, it checks every input, output and query construct. Things that convert cleanly are mapped, things needing review are flagged, and unsupported features like UDFs are blocked up front, not discovered after a failed deployment." |
| 6 | 1:45–2:05 | **Connections**: pick the Event Hub connection (or show **New…**) | "Azure never exposes the job's secrets, so I bind each source to a Fabric connection. I can even create one here, with the endpoint pre-filled from the job." |
| 7 | 2:05–2:25 | **Destinations**: **Browse…** → KQL database, then type the table | "Each output gets a Fabric destination. Here, a KQL database in our Eventhouse." |
| 8 | 2:25–2:45 | **Review**: name the Eventstream, scroll the generated JSON | "It generates the complete Eventstream definition: source, the original query as a SQL operator, and destination. Nothing hidden." |
| 9 | 2:45–3:00 | Finish → "Eventstream created" notification | "One click, and the Eventstream is created." |
| 10 | 3:00–3:30 | Open the Eventstream: canvas, click the SQL operator → **View Code** | "Here it is: the same source, the same query running in Fabric's SQL operator, writing to the Eventhouse. No rewriting." |
| 11 | 3:30–3:50 | Eventhouse → query `TestTable \| take 10` or `TestTable \| count` | "And data is already landing in the Eventhouse, ready for Real-Time dashboards and KQL." |
| 12 | 3:50–4:05 | Closing card: benefits plus next step | "Minutes instead of days per job, with risks found before migrating. Next step: roll it out tenant-wide for the team." |

## Sample queries for the assessment

Two queries in [`samples/`](./samples) show both outcomes of the SQL query evaluation. Both use the input `Source` and the output `Dest`, so they paste straight into the demo job.

| File | Assessment shows |
|---|---|
| `pass-device-telemetry.asaql` | **Can migrate.** 9 supported constructs: tumbling window, `WITH`, `TIMESTAMP BY`, `LAG`, `GROUP BY`/`HAVING`, `CASE`, `System.Timestamp()`, `CAST`. |
| `fail-udf-and-metadata.asaql` | **Blocked.** A JavaScript UDF (unsupported), plus `GetMetadataPropertyValue` and `EventEnqueuedUtcTime` (needs review). First add `fail-udf-normalizeReading.js` to the job under **Functions** as a JavaScript UDF named `normalizeReading`, with output type `float`. |

Both assume JSON events with `deviceId`, `temperature`, `humidity` and `eventTime`. The assessment reads only the query, so no data has to flow for the demo. Run **Test query** in the portal only if you also want to show results.

## Backup clips (optional)

- **The blocker story:** a job that uses a UDF, showing the Assessment step's **Blocked** finding. This shows the tool's safety net.
- **The Fabric canvas zoomed in:** a few seconds of `Source → stream → SQL → Eventhouse` for use as B-roll.

## For the management discussion afterwards

- **Status:** runs today in dev mode. A tenant-wide rollout needs one DNS record (`streamshift.pravaltech.com`) and a Fabric admin to upload the workload package. The hosting is already provisioned.
- **Scope today:** Event Hub / IoT Hub inputs; Eventhouse and Lakehouse outputs; queries that Fabric's SQL operator supports.
- **Not yet covered:** jobs with several stream inputs, UDFs, and geospatial or anomaly-detection functions. These are flagged as blocked, never silently dropped.
