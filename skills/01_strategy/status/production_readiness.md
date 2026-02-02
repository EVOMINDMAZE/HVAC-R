# Production Readiness Checklist 🚀

## 1. Implement Actual WhatsApp/SMS Logic (Completed) ✅
- [x] **Integration Strategy**: Pivoted to Telnyx for immediate SMS alerts (Meta verification blocked).
- [x] **n8n Configuration**:
    - [x] Remove `noOp` node.
    - [x] Configure Telnyx node.
    - [x] Verify message delivery (User confirmed "it's working").

## 1.5 Dynamic Configuration (Ready for Use) ⚙️
- [x] **Database**: Migration `20260115091500` applied via CLI.
- [x] **Frontend**: Inputs wired to DB and Workflow.
- [x] **n8n**: `supabase_queue_worker.json` updated. **Action**: Verified blueprints exist in `.agent/workflows/n8n/`.

## 2. Security Hardening (n8n & Backend) 🔒
- [ ] **Credential Management**:
    - [ ] Remove hardcoded Supabase keys (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) from `supabase_queue_worker.json`.
    - [ ] Configure **n8n Credentials** (Header Auth) to store these secrets securelu within n8n.
    - [ ] Update HTTP nodes to use these stored credentials instead of raw strings.
- [ ] **Environment Variables**: ensure the n8n container/instance has access to necessary env vars if using expressions.

## 3. Frontend Cleanup & Robustness 🧹
- [x] **Console Logs**:
    - [x] Removed verbose `[Workflow] ...` and `[AuthDebug]` logs.
- [ ] **Polling Safety**:
    - [ ] Implement `MAX_POLL_ATTEMPTS` (e.g., 30 attempts at 1s interval) in `useWorkflowTrigger.ts`.
    - [ ] Add timeout logic to auto-fail if n8n doesn't respond in time, preventing infinite spinners.
- [ ] **Cleanup**: Ensure `clearInterval` and `supabase.removeChannel` are always called, even on unexpected unmounts.

## 4. Error Handling & UX ⚡
- [ ] **License Validation**:
    - [ ] Test the "Invalid License" path in n8n.
    - [ ] Ensure the `error_message` returned by n8n ("License Invalid or Expired") is correctly displayed in the frontend Toast.
- [ ] **Graceful Failures**:
    - [ ] If n8n is down or Supabase Edge Function fails, show a generic "Service Unavailable" toast instead of crashing or doing nothing.
