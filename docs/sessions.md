## Teacher Dashboard: Session Management

### Overview
The teacher dashboard provides buttons to **start** and **end** a session. Each session creates a dedicated folder under `server/data/sessions/` containing three files: `session.json`, `state.jsonl`, and `events.jsonl`. Additional endpoints exist for adding snapshots and events; the `student.joined` event updates the student list in the session metadata.

### Session Lifecycle
- The teacher has a button to **start a session**.
- Each session creates a folder in `server/data/sessions/` named `session-<date>` using the format `year-month-day-hour-minute-second`, e.g. `session-2026-09-24-11-35` (example shown without seconds, but the intended format includes seconds: `session-YYYY-MM-DD-HH-mm-ss`).

### Session Folder Contents
Inside each session folder, there are three files:

#### `session.json`
Metadata describing the session.

Example:
```json
{
  "sessionId": "session-2026-09-24-001",
  "app": "geometry",
  "startedAt": "...",
  "endedAt": "...",
  "teacherId": "...",
  "students": [
    "s1",
    "s2",
    "s3"
  ],
  "activity": "equilateral-triangle"
}
```

## state.jsonl 

Periodic snapshots — chronological traces.

Example:
{"seq":1842,"t":1716542010123,students":{"s1":{"x":421,"y":183},"s2":{"x":620,"y":211},"s3":{"x":318,"y":402}}}

##  events.jsonl 

Meaningful actions/events and significant occurrences.

Examples:
08:31:04.5   student.joined
{"seq":1845,"t":1716542010523,"event":"student.joined","student":"s4"}

08:31:47.7   goal.reached
{"seq":2017,"t":1716542047723,"event":"goal.reached","data":{"metric":0.98}}
