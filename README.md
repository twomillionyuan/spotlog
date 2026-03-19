# SpotLog

SpotLog is a location-based photo journal mobile app built with Expo React Native and an OSC-managed backend provisioned through MCP.

## Monorepo Structure

- `mobile/` Expo React Native app
- `api/` Node.js REST API
- `docs/` architecture and MCP notes
- `feedback-log.md` running log of OSC/MCP friction points

## Initial Goal

The first milestone is to:

1. Provision OSC infrastructure through MCP.
2. Deploy a minimal Node.js API to OSC.
3. Verify the deployment with `/health` and basic CRUD endpoints.
