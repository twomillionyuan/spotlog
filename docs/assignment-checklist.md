# TaskSnap Assignment Checklist

This checklist maps the original `SpotLog` assignment to the current `TaskSnap` app. The product concept changed, but the required OSC/MCP capabilities are exercised through equivalent task-management features.

## Status

| Phase | Status | Notes |
|---|---|---|
| 1. MCP-driven infrastructure | Complete | Core stack was built through MCP on the `Ebba` team, then reprovisioned in `OpenEvents` to test reproducibility. |
| 2. Deploy backend API via MCP | Complete | Live OSC My App is running on the `Ebba` team and the same deployment flow was exercised again in `OpenEvents`. |
| 3. Database integration | Complete | Postgres persistence and config flow are live on `Ebba`, while backup creation, backup listing, and restore were validated during the `OpenEvents` reprovisioning pass. |
| 4. Mobile app | Complete | Expo app runs against the OSC backend on iOS and Android. |
| 5. File storage via OSC buckets | Complete | Task image attachments upload and render through OSC storage on `Ebba`, and `list-objects-on-bucket` was verified during the `OpenEvents` reprovisioning pass. |
| 6. Catalog service integration | Complete | CouchDB activity feed is integrated as a catalog service. |
| 7. Authentication | Complete | API auth, protected routes, SecureStore token storage, and per-user data are implemented. |
| 8. Production readiness via MCP | Complete with one bug | Domain, diagnostics, logs, restart, config-service binding, and operational flows are documented. The managed domain is mapped through MCP, but currently serves an incorrect response in OSC. |
| 9. Stress testing and limits | Complete | Load-test script and results target current TaskSnap endpoints. |
| 10. Final report and proposals | Complete | Final report, MCP notes, architecture, and feedback log are present. |

## Final Environment

- Team: `Ebba`
- Live app created via MCP: `tasklogbackend`
- Working app URL: `https://tasklogbackend.apps.osaas.io`

## Reproducibility Environment

- Team: `OpenEvents`
- Purpose: reprovisioning, backup/restore validation, bucket inspection retry, and domain verification
- Status: cleaned up after verification so no TaskSnap app/service deployment remains there

## Known OSC Bug

- In the `OpenEvents` verification run, the managed `apps.dev.osaas.io` mapping could appear successful in MCP while the hostname served the wrong response. The final Ebba deployment uses `tasklogbackend.apps.osaas.io`, which is currently healthy.
