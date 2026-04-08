# TaskSnap Phase 10 Final Report

Date: 2026-04-08

## Executive Summary

TaskSnap is the final outcome of this assignment, to build a real mobile app with OSC as the backend, manage that backend through MCP, document friction, and turn those findings into concrete platform proposals.

The final result is a working Expo mobile app backed by an OSC-hosted Node.js API, PostgreSQL, OSC storage, parameter-store configuration, and a catalog-service integration through CouchDB. The project was exercised across two OSC teams during the assignment:

- `Ebba` team: retained deployment and day-to-day app iteration
- `OpenEvents` team: reproducibility run, backup/restore validation, bucket inspection retry, domain testing, and production-readiness verification

The `OpenEvents` deployment was later removed so TaskSnap remains deployed only in `Ebba`. That cleanup is part of the project history and is relevant to the final DX findings because it exposed which operations were easy to repeat through MCP and which ones still felt brittle or ambiguous.

Current live production URL:

- `https://tasklogbackend.apps.osaas.io`

The strongest parts of OSC were MCP-driven service provisioning, flexible composition of open-source backend primitives, and the ability to get a real backend live quickly. The weakest parts were long-running MCP operations with unclear completion state, incomplete mobile-BaaS ergonomics, confusing app-build/runtime behavior in My Apps, and a production-facing managed-domain routing bug.

## Scope and Sources

This Phase 10 report is based on the full project record rather than only the latest repo snapshot.

Sources used:

- repository code and docs in `/Users/ebbalanyuan/spotlog`
- git history from `ee39c3a` through `3e3f138`
- live deployment and debugging work completed through OSC MCP during this project
- the running `feedback-log.md`
- app iteration and deployment history captured in chat during the assignment
- final Expo / EAS packaging work for downloadable builds

## What Was Built

TaskSnap is a mobile to-do app built with Expo and React Native. Users can register, log in, create multiple lists, add tasks inside those lists, rank work by urgency and due date, mark tasks complete, reorder lists, attach files to tasks, and track progress across open, overdue, and completed work.

The backend stack exercises the same OSC capabilities the original SpotLog assignment required:

- PostgreSQL for user, list, task, and completion data
- OSC storage bucket for task attachments
- Node.js API on OSC My Apps
- parameter store for configuration and secrets
- managed domain operations through MCP
- one catalog service integration through CouchDB for activity history

## Project Timeline

Key milestones from git history and chat history:

1. `ee39c3a` to `bbdff23`: initial SpotLog scaffold, OSC backend connection, and mobile shell
2. `133e008` to `cbcfdbc`: live OSC Postgres and storage integration, direct API start in OSC, app-health logging, and deploy hardening
3. `bedab37` to `530ad99`: OSC friction documentation, CouchDB activity integration, realtime polling, and deployment fixes
4. `cee1cb4`: product pivot from SpotLog to TaskSnap
5. `6d32e19` and `3e3f138`: assignment alignment, checklist, final docs, load testing, and evidence consolidation
6. post-git work in chat: `OpenEvents` reprovisioning, backup/restore validation, bucket inspection retry, managed-domain bug verification, Android/iOS packaging setup, and final cleanup back to `Ebba`-only deployment

## Final Technical State

### App

- Expo React Native client
- iOS-first development workflow validated in Simulator
- Android workflow validated in emulator
- EAS project configured for downloadable builds

### Backend

- Node.js API deployed on OSC My Apps
- PostgreSQL-backed persistence
- parameter-store based configuration
- task attachment upload/download through OSC storage
- CouchDB-backed activity history as the catalog-service integration
- current Ebba deployment verified with `200 OK` on `/health`

### Packaging

- Expo project linked to EAS as `@onemillionyuan/tasksnap`
- Android preview build started successfully
- iOS installable build blocked only by Apple Developer account enrollment, not by app code or Expo configuration

### Deployment History

- `Ebba` team: retained deployment
- `OpenEvents` team: temporary full reprovision used to prove reproducibility, backup/restore, domain mapping, and bucket inspection
- `OpenEvents` TaskSnap app, databases, and config services were removed after verification so the project is no longer deployed there

## Phase-by-Phase Completion

| Phase | Status | Notes |
|---|---|---|
| 1. MCP-Driven Infrastructure | Complete | Postgres, storage, parameter store, and app stack were provisioned through MCP. Reprovisioning was demonstrated again in `OpenEvents`. |
| 2. Deploy Backend API via MCP | Complete | The Node.js API was deployed, restarted, rebuilt, logged, and tested through MCP-managed OSC app workflows. |
| 3. Database Integration | Complete | CRUD, migrations, parameter-store config, backup creation, backup listing, and restore were all exercised. Restore was verified with a sentinel-task test. |
| 4. Mobile App | Complete | Expo app built and run against OSC backend on iOS and Android, with auth, lists, tasks, edit flows, pull-to-refresh, loading, and error handling. |
| 5. File Storage via OSC Buckets | Complete | Task attachments upload through the API to OSC storage and render from storage URLs. Bucket inspection through MCP was tested successfully in `OpenEvents` after earlier failure elsewhere. |
| 6. Catalog Service Integration | Complete | CouchDB was integrated for activity history and feed-style sync visibility. |
| 7. Authentication | Complete | Email/password auth, protected endpoints, SecureStore token storage, and per-user data scoping were implemented. |
| 8. Production Readiness via MCP | Complete with one platform bug | App diagnostics, logs, restart flows, config switching, domain mapping, and architecture documentation were completed. Managed-domain routing remains buggy. |
| 9. Stress Testing and Limits | Complete | Load test coverage was added for current TaskSnap endpoints with `10`, `50`, and `100` concurrent requests. |
| 10. Final Report and Proposals | Complete | This document, the feedback log, checklist, and presentation brief capture the final findings and recommendations. |

## What Worked Well

- MCP made it possible to provision real infrastructure quickly without falling back to the web UI for normal happy-path operations.
- OSC’s service model was composable enough to support a nontrivial mobile app backend from open-source primitives.
- My Apps was capable of hosting a real monorepo-based Node backend after the deploy scripts were adapted to the runner behavior.
- PostgreSQL, bucket storage, and parameter-store config were enough to support a meaningful production-like app.
- The ability to reprovision the stack in a second team was strong evidence that OSC can support MCP-first infrastructure workflows.

## Categorized Findings

### MCP Gaps

- `setup-parameter-store` can appear to fail or time out even when the parameter store and backing Valkey instance were actually created.
- Long-running flows such as backup and restore still require manual follow-up polling rather than returning a durable job handle with explicit status.
- Some catalog services can be created and described through MCP but not explored deeply enough at the endpoint level to support fully MCP-native integration.
- Domain tools can report a mapping as complete while the routed hostname still serves the wrong upstream.
- Bucket operations were not consistently reliable across environments. The same bucket-inspection step failed in one environment and later worked in another.

### BaaS Gaps

- OSC does not currently provide a polished mobile-ready auth product comparable to Firebase Auth or Supabase Auth.
- There is no first-class realtime sync path targeted at CRUD-heavy mobile apps. TaskSnap had to approximate this with polling and activity history rather than a native event stream.
- Storage works as an infrastructure primitive but lacks higher-level mobile helpers such as presigned-upload workflows, thumbnail processing, or stronger client-facing conventions.
- Developers still need to compose several backend pieces manually rather than starting from a cohesive mobile-backend solution.

### DX Improvements

- My Apps build/runtime behavior is not transparent enough. Dependency-install mode, workspace handling, cache reuse, and devDependency expectations were major sources of confusion.
- Errors are often technically correct but not actionable enough for debugging inside Claude Code without extra probing.
- Service naming and schema conventions can drift from docs, which slows down first-time provisioning.
- Packaging the mobile app for download required extra manual steps outside OSC, which is expected, but the separation between backend readiness and mobile-release readiness should be called out more clearly in assignment framing.

### Bugs

- Managed `apps.dev.osaas.io` domain routing can serve the wrong content even after successful MCP mapping.
- `setup-parameter-store` can time out after completing real backend work.
- Backup reliability is inconsistent. One backup attempt failed with `FailureTarget` before a later backup succeeded.
- Cached app dependency state in My Apps can look like an application regression until a rebuild and cache-refresh path is forced.
- Bucket inspection behavior was inconsistent across environments before succeeding in the final reprovisioned setup.

## Evidence Highlights

- The project was not only built once; it was also reprovisioned in a second OSC team to test reproducibility.
- Backup/restore was validated with a real sentinel-task check rather than only trusting control-plane status.
- Bucket inspection was tested again after an earlier failure, which turned a suspected universal storage problem into a more precise environment-dependent finding.
- Managed-domain mapping was verified as a genuine platform issue because MCP showed the mapping as active while the runner URL still served the correct app and the managed domain did not.
- Android packaging progressed to a real EAS build, and iOS packaging reached the Apple enrollment boundary rather than failing on project configuration.

## Top 5 Improvement Proposals

### 1. Fix managed domain routing for My Apps

- Problem: OSC can report a successful managed-domain mapping while the mapped hostname serves the wrong content.
- Suggested solution: Add post-map verification before reporting success, and show route-target mismatch details in `diagnose-my-app`.
- Who benefits: Any team exposing OSC apps behind managed or custom domains.
- Impact: Very high. This is a production-facing correctness issue.

### 2. Turn long-running MCP operations into explicit jobs

- Problem: Parameter-store setup, backup, and restore still feel ambiguous because initiating calls can time out or complete without a durable progress contract.
- Suggested solution: Return a job id plus machine-readable states such as `queued`, `running`, `succeeded`, and `failed`, with a dedicated polling tool.
- Who benefits: MCP-first users, AI-agent workflows, and anyone building reproducible OSC automation.
- Impact: Very high. It would remove much of the uncertainty in MCP-led operations.

### 3. Expose clearer My Apps build and cache diagnostics

- Problem: Build/runtime failures were hard to interpret because install mode, workspace package inclusion, and cache provenance were not obvious.
- Suggested solution: Add first-class build metadata, lockfile fingerprint visibility, cache hit/miss reporting, and a documented cache-bust path.
- Who benefits: Monorepo users and developers deploying TypeScript/Node services with nontrivial build steps.
- Impact: High. This would significantly reduce debugging time.

### 4. Provide a first-class mobile auth and realtime starter path

- Problem: The biggest gap versus Firebase and Supabase is not raw infrastructure, but the lack of a cohesive mobile BaaS opinion for auth plus sync.
- Suggested solution: Offer an MCP-provisioned mobile starter stack with auth, token refresh guidance, storage conventions, and a documented realtime/event option.
- Who benefits: Mobile teams deciding whether OSC can replace more opinionated BaaS platforms.
- Impact: High. This would make OSC much more attractive for this assignment’s target use case.

### 5. Improve service endpoint discoverability and schema consistency

- Problem: Some services are easy to reason about through MCP while others stop at config schema or expose naming mismatches against docs.
- Suggested solution: Expand endpoint metadata coverage, publish OpenAPI where possible, and align live schema names with docs and examples.
- Who benefits: New users, AI agents, and developers composing multiple OSC services into one app backend.
- Impact: Medium-high. This would improve both first-run success and confidence.

## Comparison to Firebase and Supabase

- OSC is stronger on composability, open-source primitives, and AI-driven infrastructure control through MCP.
- Firebase and Supabase are stronger on integrated developer experience for mobile apps, especially auth, client SDK ergonomics, and realtime features.
- OSC’s differentiator is real, but to compete credibly for mobile-backend use cases it needs more predictable operations and a stronger opinionated BaaS layer on top of the primitives.

## Recommendation to the Team

- Keep investing in MCP as a core product surface because it is already a meaningful differentiator.
- Prioritize production confidence before expanding the catalog further. Domain correctness and explicit long-running job tracking matter more than adding more surface area.
- Strengthen the mobile-backend story by packaging auth, storage, and sync into a clearer recommended path.
- Use this assignment as an internal benchmark: the platform is already capable, but the rough edges show up exactly where a real mobile app moves from prototype to production.

## Bottom Line

TaskSnap proves that OSC can support a real MCP-first mobile application stack end to end. The platform is already good enough to provision infrastructure, host an API, store files, manage config, and support production-style workflows through an agent-assisted interface.

The project also makes the remaining gaps concrete. The next improvements OSC should prioritize are not more basic provisioning primitives, but clearer long-running job visibility, stronger app-build diagnostics, mobile-focused BaaS ergonomics, and above all reliable domain routing.
