# Immediate Activation Checklist 🚀

## Phase 2: Integration Credentials & Real OAuth

### 1. Developer Portals (Action Required) 🔑
We need to register "ThermoNeural" to get the keys.
- [ ] **Sensibo:** Get API Key from [home.sensibo.com/me/api](https://home.sensibo.com/me/api).
- [ ] **Honeywell (Resideo):** Create Account at [developer.honeywellhome.com](https://developer.honeywellhome.com/).
- [ ] **SmartThings:** Create Account at [smartthings.developer.samsung.com](https://smartthings.developer.samsung.com/).

### 2. Secure The Landing Page 🔓
Allow the public landing page to read *safe* data about an invite without exposing the whole DB.
- [ ] Create Postgres Function `get_public_invite_info(integration_id)`.
- [ ] Update `IntegrationLanding.tsx` to call this function on load.
    - If invalid ID -> Show "Expired or Invalid".
    - If valid -> Show "Connect [Provider]".

### 3. Handle The Return (Callback) ↩️
- [ ] Create `client/pages/Callback.tsx` to handle the return trip.
    - Route: `/callback`
    - Logic: Grab `code` from URL -> Send to Supabase/n8n.
