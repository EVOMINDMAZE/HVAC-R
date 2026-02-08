# Render Calculation Service 🧮

## Overview
While the **Core App** lives on Supabase/Netlify and **Automations** live on Supabase Edge Functions, the **Heavy Math** (Complex Psychometrics, Load Calculations, Energy Modeling) is offloaded to a specialized service hosted on **Render**.

## Why Render?
- **Python/Go Support**: Supabase Edge Functions (Deno) are great for logic, but Python (SciPy, NumPy) is king for Engineering Math.
- **Scalability**: Auto-scaling based on CPU load.
- **Isolation**: Crashes in calculation logic do not bring down the main app.

## Endpoints
The Main App connects to this service via the `CALCULATION_SERVICE_URL` environment variable.

### 1. Psychrometric State
- **POST** `/calculate/psychrometrics`
- **Input**: `{ dry_bulb, wet_bulb, altitude }`
- **Output**: `{ humidity, enthalpy, dew_point, air_density }`

### 2. Load Calculation (Manual J Lite)
- **POST** `/calculate/load`
- **Input**: `{ building_data_json }`
- **Output**: `{ heating_load, cooling_load, cfm_required }`

## Deployment
This service is deployed via Git Push to the `thermoneural-calc` repository on Render.
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `gunicorn app:app`
