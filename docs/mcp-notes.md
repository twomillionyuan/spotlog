# MCP Notes

This file records the OSC MCP calls used for TaskSnap and what they proved.

Legacy note: some OSC resource names below still contain `spotlog` because those were the names used when the backing services were first created.

## Discovery

- `list-service-categories`
- `list-available-services { category: "database" }`
- `list-available-services { category: "storage" }`
- `get-service-schema { serviceId: "apache-couchdb" }`
- `get-service-endpoints { serviceId: "apache-couchdb" }`
- `list-my-services`
- `list-my-apps`
- `list-my-domains`
- `get-my-plan`

## Infrastructure Verification

- `create-database { type: "postgres", name: "tasklogdb", opts: { username: "tasklog", password: "...", database: "tasklog" } }`
- `create-database { type: "couchdb", name: "tasklogcouch", opts: { rootPassword: "..." } }`
- `create-storage-bucket { bucketName: "tasklog-media" }`
- `setup-parameter-store { name: "tasklogconfig" }`
- `set-parameter { parameterStore: "tasklogconfig", key: "DATABASE_URL", value: "postgresql://..." }`
- `set-parameter { parameterStore: "tasklogconfig", key: "COUCHDB_URL", value: "https://team2-tasklogcouch.apache-couchdb.auto.prod.osaas.io" }`
- `set-parameter { parameterStore: "tasklogconfig", key: "S3_ENDPOINT_URL", value: "https://team2-mcpstorage.minio-minio.auto.prod.osaas.io" }`
- `set-parameter { parameterStore: "tasklogconfig", key: "S3_BUCKET_NAME", value: "tasklog-media" }`
- `list-service-instances { serviceId: "birme-osc-postgresql" }`
- `list-service-instances { serviceId: "apache-couchdb" }`
- `list-service-instances { serviceId: "minio-minio" }`
- `list-service-instances { serviceId: "eyevinn-app-config-svc" }`
- `list-service-instances { serviceId: "valkey-io-valkey" }`
- `list-parameters { parameterStore: "tasklogconfig" }`

## Application Operations

- `create-my-app { name: "tasklogbackend", type: "nodejs", gitHubUrl: "https://github.com/twomillionyuan/spotlog.git", configService: "tasklogconfig" }`
- `get-my-app { appId: "tasklogbackend" }`
- `diagnose-my-app { appName: "tasklogbackend" }`
- `get-my-app-logs { appId: "tasklogbackend", tail: 80 }`
- `restart-my-app { appId: "tasklogbackend" }`
- `restart-my-app { appId: "tasklogbackend", rebuild: true }`

## Config-Switch Exercise

- Earlier in development, the same config-switch workflow was exercised on the Ebba deployment by creating a temporary parameter store, rebinding the app to it, then switching back.
- A full reprovision in `OpenEvents` reused `tasklogconfig` to confirm the stack could be stood up again from MCP-managed services.

## Storage Integration

- `list-objects-on-bucket { bucketName: "tasklog-media", recursive: true }`
- Result: bucket listing succeeded in the `OpenEvents` reprovisioned environment after failing earlier elsewhere, which narrowed the issue to environment-specific behavior rather than a universal MinIO limitation.

## Catalog Service Integration

- `describe-service-instance { serviceId: "apache-couchdb", name: "tasklogcouch" }`
- `set-parameter { parameterStore: "tasklogconfig", key: "COUCHDB_URL", value: "https://team2-tasklogcouch.apache-couchdb.auto.prod.osaas.io" }`
- `set-parameter { parameterStore: "tasklogconfig", key: "COUCHDB_USER", value: "admin" }`
- `set-parameter { parameterStore: "tasklogconfig", key: "COUCHDB_PASSWORD", value: "..." }`
- `set-parameter { parameterStore: "tasklogconfig", key: "COUCHDB_DATABASE", value: "tasklogactivity" }`

## Backup / Restore Test

- `create-backup { serviceId: "birme-osc-postgresql", instanceName: "tasklogdb" }`
- `list-backups { serviceId: "birme-osc-postgresql", instanceName: "tasklogdb" }`
- `restore-backup { serviceId: "birme-osc-postgresql", instanceName: "tasklogdb", backupId: "bakteam21774528081808" }`
- Verification: a post-backup sentinel task was created through the live API and disappeared after restore, proving that the backup/restore flow worked in the `OpenEvents` reprovisioned stack.

## Domain / Diagnostics

- `check-domain-availability { domain: "tasklogbackend.apps.dev.osaas.io" }`
- `update-my-domain { instanceName: "tasklogbackend", serviceId: "eyevinn-web-runner", domain: "tasklogbackend.apps.dev.osaas.io" }`
- `list-my-domains`
- `diagnose-my-app { appName: "tasklogbackend" }`
- Result: in `OpenEvents`, OSC reported the managed domain as mapped, but the `apps.dev.osaas.io` hostname served the wrong content. The final Ebba deployment is currently healthy at `https://tasklogbackend.apps.osaas.io`.

## Notes

- The app concept changed from SpotLog to TaskSnap, but the same OSC stack is exercised: Postgres, bucket storage, parameter store, managed app, domain, and one catalog service.
- `setup-parameter-store` timed out for `tasklogconfig`, but the service instances were actually created. The timeout is itself a useful DX finding.
- `apache-couchdb` has no OpenAPI spec in OSC today, so integration required direct HTTP usage instead of `call-service-endpoint`.
- `restart-my-app` with `rebuild: true` was required after the runner reused a broken dependency cache. After the root build script and lockfile were fixed, normal restarts were sufficient again.
- Final live app endpoint after cleanup: `https://tasklogbackend.apps.osaas.io`.
