# TaskSnap Phase 10 Presentation Brief

## 1. What Was Built

- `TaskSnap`, a mobile to-do app built with Expo
- Backend fully managed on OSC through MCP
- Final live OSC stack in `Ebba`: PostgreSQL, MinIO bucket, parameter store, Node My App, and CouchDB catalog integration
- Separate `OpenEvents` reprovisioning run used for backup/restore, bucket inspection, and domain verification

## 2. What Worked Well

- MCP made infrastructure provisioning fast once the service schemas were understood.
- My Apps was good enough to deploy and iterate on a real Node backend.
- OSC’s open-source building blocks made it easy to assemble a portable backend stack.

## 3. Main Friction Points

- Long-running MCP calls can time out or feel ambiguous even when the work succeeded.
- My Apps caching and dependency behavior are hard to reason about during debugging.
- Managed domain mapping can report success while routing is still wrong.
- Mobile BaaS primitives are still not as integrated as Firebase or Supabase.

## 4. Top 5 Improvements

1. Fix managed domain routing for My Apps.
2. Turn long-running MCP operations into explicit jobs with status polling.
3. Expose clearer My Apps build and cache diagnostics.
4. Provide a first-class mobile auth path.
5. Improve service endpoint discoverability for the catalog.

## 5. Bottom Line

- OSC is already viable for MCP-first app deployment.
- The biggest remaining gaps are not basic provisioning, but production confidence and mobile-backend ergonomics.
- If domain routing, long-running job feedback, and mobile auth improve, OSC becomes much stronger as a serious Firebase/Supabase alternative for AI-assisted app builders.
