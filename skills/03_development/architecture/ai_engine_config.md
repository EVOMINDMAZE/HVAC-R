# AI Engine Configuration

The application is currently configured to use **DeepSeek-V3** as the primary AI model for troubleshooting and diagnostics, delivered via Supabase Edge Functions.

## Configuration Details
- **Gateway**: `supabase/functions/ai-gateway`
- **Routing**: Centralized model routing via `mode` parameter.
- **Providers**:
    - **xAI**: `grok-2-vision-1212` (Vision analysis)
    - **DeepSeek**: `deepseek-chat` (Primary reasoning)
    - **Groq**: Llama-3 (High-speed fallback)
- **Service**: Managed via Supabase Edge Functions (`ai-troubleshoot` and `analyze-triage-media`).

## Modes Supported
- `vision`: Advanced image analysis (Grok-2).
- `fast-reasoning`: High-speed technical lookup (Groq/Llama-8b).
- `general`: DeepSeek-V3 for diagnostic analysis.
- `physics`: Thermodynamic calculations (Calculators).

## Persona Framework
The engine dynamically switches personas based on the interaction context:
- **Homeowner Persona**: Focuses on "DIY Safety". Prioritizes checking filters/breakers and identifies situations requiring a Professional Truck Roll.
- **Technician Persona**: Focuses on "Technical Precision". Analyzes pressure, subcooling, and diagnostic codes to provide field-level fix suggestions.
