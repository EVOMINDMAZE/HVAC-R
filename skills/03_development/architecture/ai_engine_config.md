---
name: AI Engine Configuration
description: The application is currently configured to use DeepSeek-V3 as the primary AI model for troubleshooting and diagnostics, delivered via Supabase Edge...
version: 1.0
---

# AI Engine Configuration

The application is currently configured to use **DeepSeek-V3** as the primary AI model for troubleshooting and diagnostics, delivered via Supabase Edge Functions.

## Configuration Details

- **Gateway**: `supabase/functions/ai-gateway`
- **Routing**: Centralized model routing via `mode` parameter.
- **Providers**:
  - **xAI**: `grok-2-1212` (Reasoning), `grok-2-vision-1212` (Vision)
  - **DeepSeek**: `deepseek-reasoner` (Physics & Technical Logic)
  - **Groq**: `llama-3.3-70b-versatile` (Fast UI & Fallback)
- **Service**: Managed via Supabase Edge Functions (`ai-troubleshoot` and `analyze-triage-media`).

## Modes Supported

- `fast-reasoning`: Grok-2 (`grok-2-1212`) for complex field troubleshooting logic.
- `vision`: Grok-2 Vision (`grok-2-vision-1212`) for technical nameplate & component analysis.
- `physics`: DeepSeek (`deepseek-reasoner`) for high-precision thermodynamic validation.
- `general`: Groq (`llama-3.3-70b-versatile`) for lightning-fast customer interaction.

## Persona Framework

The engine dynamically switches personas based on the interaction context:

- **Homeowner Persona**: Focuses on "DIY Safety". Prioritizes checking filters/breakers and identifies situations requiring a Professional Truck Roll.
- **Technician Persona**: Focuses on "Technical Precision". Analyzes pressure, subcooling, and diagnostic codes to provide field-level fix suggestions.
