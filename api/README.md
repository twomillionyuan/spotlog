# TaskSnap API

Node.js REST API for the TaskSnap mobile app.

## Endpoints

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /api/dashboard`
- `GET /api/activity`
- `GET /api/lists`
- `POST /api/lists`
- `POST /api/lists/reorder`
- `GET /api/lists/:id`
- `PATCH /api/lists/:id`
- `DELETE /api/lists/:id`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/:id/attachment`
- `DELETE /api/tasks/:id/attachment`

## Runtime Requirements

- `DATABASE_URL`
- `JWT_SECRET`
- Optional storage config:
  - `S3_ENDPOINT_URL`
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`
  - `S3_BUCKET_NAME`
  - `S3_REGION`
- Optional catalog-service config:
  - `COUCHDB_URL`
  - `COUCHDB_USER`
  - `COUCHDB_PASSWORD`
  - `COUCHDB_DATABASE`

If storage is configured, TaskSnap supports task image attachments stored in OSC MinIO.  
If CouchDB is configured, TaskSnap exposes a synced activity feed through `/api/activity`.
