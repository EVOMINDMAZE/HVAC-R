# Render Deployment Guide

This document covers the deployment and management of the **Render Calculation Service** - the heavy compute engine for thermodynamic calculations.

## Service Overview

| Property       | Value                                                       |
| -------------- | ----------------------------------------------------------- |
| **Purpose**    | Heavy HVAC calculations (Psychrometrics, Load Calculations) |
| **Technology** | Python + FastAPI + CoolProp                                 |
| **Hosting**    | Render Web Service                                          |
| **Scaling**    | Auto-scaling (1-3 instances)                                |

### Why Render?

- **Python Support**: CoolProp/SciPy for engineering math
- **Auto-scaling**: Handles burst calculation loads
- **Isolation**: Crashes don't affect the main app
- **Cost-effective**: Pay for what you use

## Configuration

### render.yaml (Blueprint)

```yaml
services:
  - name: hvacr-server
    type: web
    env: node
    region: us-east
    plan: standard
    buildCommand: npm run build
    startCommand: npm run start
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: VITE_SUPABASE_URL
        fromDatabase: false
      - key: VITE_SUPABASE_ANON_KEY
        fromDatabase: false
    scale:
      minInstances: 1
      maxInstances: 3
```

## Deployment Methods

### Method 1: Auto-Deploy (Recommended)

1. Connect your GitHub repository to Render
2. Enable auto-deploy on push to `main`
3. Render automatically rebuilds on each push

**Setup:**

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" > "Web Service"
3. Connect your GitHub repository
4. Configure build settings
5. Enable "Auto-Deploy" in settings

### Method 2: Deploy Hook (CI/CD)

Trigger deployments from GitHub Actions:

```bash
# Add to GitHub Secrets
RENDER_DEPLOY_HOOK_URL=https://api.render.com/deploy/srv-...

# Trigger deployment
curl -X POST "$RENDER_DEPLOY_HOOK_URL"
```

**Get Deploy Hook URL:**

1. Render Dashboard > Your Service > Settings
2. Scroll to "Deploy Hook"
3. Copy the URL

### Method 3: Blueprint Deployment

1. Push `render.yaml` to your repository
2. Go to [Render Blueprints](https://dashboard.render.com/blueprints)
3. Click "New Blueprint Instance"
4. Connect repository
5. Render auto-detects `render.yaml`

### Method 4: Manual Deploy

1. Go to Render Dashboard > Your Service
2. Click "Manual Deploy"
3. Select "Deploy latest commit"

## Environment Variables

Set these in Render Dashboard > Service > Environment:

### Required

| Variable                 | Description          |
| ------------------------ | -------------------- |
| `NODE_ENV`               | `production`         |
| `VITE_SUPABASE_URL`      | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key    |

### Optional

| Variable                    | Description                              |
| --------------------------- | ---------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | For server-side operations               |
| `PORT`                      | Service port (Render sets automatically) |

## API Endpoints

The calculation service exposes:

### Health Check

```
GET /health
Response: { "status": "ok" }
```

### Psychrometric Calculation

```
POST /calculate/psychrometrics
Body: {
  "dry_bulb": 75,
  "wet_bulb": 65,
  "altitude": 0
}
Response: {
  "humidity": 65.2,
  "enthalpy": 28.5,
  "dew_point": 62.1,
  "air_density": 1.18
}
```

### Load Calculation

```
POST /calculate/load
Body: {
  "building_data": { ... }
}
Response: {
  "heating_load": 45000,
  "cooling_load": 36000,
  "cfm_required": 1200
}
```

## Monitoring

### Health Checks

Render automatically monitors `/health` endpoint:

- **Success**: HTTP 200
- **Failure**: Service restart triggered

### Logs

View logs in Render Dashboard > Service > Logs

```bash
# Filter by type
[INFO] Application started
[ERROR] Calculation failed: ...
```

### Metrics

Monitor in Render Dashboard > Service > Metrics:

- Request count
- Response time
- Memory usage
- CPU usage

## Scaling Configuration

### Auto-Scaling Rules

```yaml
scale:
  minInstances: 1 # Always have 1 instance
  maxInstances: 3 # Scale up to 3 under load
```

### Manual Scaling

1. Render Dashboard > Service > Settings
2. Scroll to "Instance Count"
3. Adjust min/max instances

### Cost Considerations

| Plan     | Price  | Use Case                              |
| -------- | ------ | ------------------------------------- |
| Free     | $0     | Development only (sleeps after 15min) |
| Starter  | $7/mo  | Low traffic                           |
| Standard | $25/mo | Production (recommended)              |
| Pro      | $85/mo | High traffic                          |

## Troubleshooting

### Service Not Starting

**Check:**

1. Build logs for errors
2. Environment variables set correctly
3. Start command correct

**Fix:**

```bash
# Test locally first
npm run build
npm run start
```

### Slow Response Times

**Causes:**

- Cold start (service was sleeping)
- High CPU calculations
- Memory pressure

**Fix:**

- Use Standard plan (always-on)
- Increase instance count
- Optimize calculation code

### Deploy Failing

**Check:**

1. Build logs for errors
2. `package.json` scripts correct
3. Dependencies installing

**Common fixes:**

```bash
# Clear build cache
# Render Dashboard > Service > Settings > Clear Build Cache

# Check Node version
# Add to render.yaml:
# env:
#   - key: NODE_VERSION
#     value: 20
```

### Health Check Failing

**Check:**

1. `/health` endpoint returns 200
2. Service starting correctly
3. Port binding correct

**Fix:**

```javascript
// Ensure health endpoint exists
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});
```

## Integration with Main App

The main app connects via `CALCULATION_SERVICE_URL`:

```typescript
// client/lib/api.ts
const CALC_URL = import.meta.env.VITE_CALCULATION_SERVICE_URL;

export async function calculatePsychrometrics(data: PsychData) {
  const response = await fetch(`${CALC_URL}/calculate/psychrometrics`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

## Best Practices

### 1. Always Use Health Checks

```yaml
healthCheckPath: /health
```

### 2. Set Resource Limits

```yaml
plan: standard # Prevents runaway costs
scale:
  maxInstances: 3
```

### 3. Use Environment Variables

Never hardcode secrets:

```yaml
envVars:
  - key: API_KEY
    sync: false # Manual entry required
```

### 4. Monitor Costs

- Set billing alerts in Render Dashboard
- Review usage monthly
- Scale down during low-traffic periods

### 5. Implement Caching

For repeated calculations:

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def calculate_psychrometrics(dry_bulb, wet_bulb, altitude):
    # Expensive calculation
    return result
```
