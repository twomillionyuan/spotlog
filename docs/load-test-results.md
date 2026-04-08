# Load Test Results

Target used for measured run: `https://tasklogbackend.apps.osaas.io`

Final deployed environment: `Ebba`

- Working app URL: `https://tasklogbackend.apps.osaas.io`
- Note: a separate `OpenEvents` reprovisioning run was used to validate backup/restore, bucket inspection, and a managed-domain bug before that temporary environment was removed.

Method:

- `npm run load:test`
- Endpoint set: `/health`, authenticated `GET /api/lists`, authenticated `GET /api/dashboard`
- Concurrency set: `10`, `50`, `100`
- Runtime monitoring: `get-my-app`, `get-my-app-logs`, `diagnose-my-app`

## Results

### `/health`

| Concurrency | Success | Errors | Avg ms | P50 ms | P95 ms | Max ms |
|---|---:|---:|---:|---:|---:|---:|
| 10 | 10/10 | 0 | 30.04 | 30.06 | 34.56 | 34.56 |
| 50 | 50/50 | 0 | 40.06 | 42.80 | 61.69 | 63.34 |
| 100 | 100/100 | 0 | 43.03 | 51.53 | 73.68 | 75.22 |

### `GET /api/lists`

| Concurrency | Success | Errors | Avg ms | P50 ms | P95 ms | Max ms |
|---|---:|---:|---:|---:|---:|---:|
| 10 | 10/10 | 0 | 173.17 | 186.85 | 187.43 | 187.43 |
| 50 | 50/50 | 0 | 138.45 | 137.64 | 164.39 | 165.80 |
| 100 | 100/100 | 0 | 212.53 | 188.39 | 353.43 | 354.36 |

### `GET /api/dashboard`

| Concurrency | Success | Errors | Avg ms | P50 ms | P95 ms | Max ms |
|---|---:|---:|---:|---:|---:|---:|
| 10 | 10/10 | 0 | 29.61 | 28.18 | 32.46 | 32.46 |
| 50 | 50/50 | 0 | 95.32 | 90.27 | 125.53 | 127.11 |
| 100 | 100/100 | 0 | 214.90 | 208.48 | 356.17 | 357.35 |

## MCP Monitoring Summary

- `get-my-app` reported the app as `running` during the test.
- `diagnose-my-app` reported no issues.
- `get-my-app-logs` showed no new error lines during the load run.

## Takeaways

- The single-instance app handled short bursts of 100 concurrent requests without errors.
- Authenticated task-list and dashboard requests scaled less gracefully than `/health`, but remained stable.
- The dominant OSC friction during this phase was deployment caching and MCP visibility around long-running operations, not raw request handling.
