# MCP Notes

Track exact OSC MCP calls here as you go.

## Infrastructure Checklist

- Connect to OSC MCP endpoint
- Inspect catalog with `list-service-categories`
- Inspect services with `list-available-services`
- Inspect config with `get-service-schema`
- Create Postgres
- Create storage bucket
- Set up parameter store
- Store `DATABASE_URL`
- Verify resources with `list-my-services`
- Verify health with `get-instance-status`

## Deployment Checklist

- Create API repo
- Deploy app with `create-my-app`
- Bind config service
- Check logs with `get-my-app-logs`
- Restart with `restart-my-app`
