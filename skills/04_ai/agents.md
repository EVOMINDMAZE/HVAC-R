---
name: AI Agents & Protocols 🤖
description: Comprehensive documentation for AI agents (Antigravity) including protocols, authentication, testing standards, and AI engine configuration.
version: 1.0
---

# AI Agents & Protocols 🤖

## Overview

This skill defines the standards, protocols, and configurations for AI agents interacting with the ThermoNeural platform. It covers both the **AI Engine** (DeepSeek, Grok, Groq) used for troubleshooting and diagnostics, and the **Agent Protocols** for automated testing and interaction.

## AI Engine Configuration

The application uses a multi‑model AI engine delivered via Supabase Edge Functions.

### Gateway & Routing

- **Gateway**: `supabase/functions/ai-gateway`
- **Routing**: Centralized model routing via `mode` parameter.

### Supported Models & Providers

- **xAI**: `grok-2-1212` (Reasoning), `grok-2-vision-1212` (Vision)
- **DeepSeek**: `deepseek-reasoner` (Physics & Technical Logic)
- **Groq**: `llama-3.3-70b-versatile` (Fast UI & Fallback)

### Modes & Personas

- `fast-reasoning`: Grok‑2 (`grok-2-1212`) for complex field troubleshooting logic.
- `vision`: Grok‑2 Vision (`grok-2-vision-1212`) for technical nameplate & component analysis.
- `physics`: DeepSeek (`deepseek-reasoner`) for high‑precision thermodynamic validation.
- `general`: Groq (`llama-3.3-70b-versatile`) for lightning‑fast customer interaction.

The engine dynamically switches personas based on interaction context:

- **Homeowner Persona**: Focuses on "DIY Safety". Prioritizes checking filters/breakers and identifies situations requiring a Professional Truck Roll.
- **Technician Persona**: Focuses on "Technical Precision". Analyzes pressure, subcooling, and diagnostic codes to provide field‑level fix suggestions.

## Agent & Subagent Protocols

### 7.1. Browsing Subagent Standards

1. **Headless‑First**: The subagent must operate in a headless‑first manner unless visual debugging is explicitly requested by the user.
2. **Single Tab Policy**: The subagent must ALWAYS use a **single tab** and navigate through it. Do not spawn multiple tabs unless explicitly instructed for a specific parallel test.
3. **Authentication**: Use the following credentials when testing the app login flows:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@admin.com` | `ThermoAdmin$2026!` |
| **Technician** | `tech@test.com` | `Password123!` |
| **Client** | `client@test.com` | `Password123!` |

*Note: If these fail, check `supabase/seed.sql` or the User Management dashboard.*

### 7.2. Headless Testing Protocol

1. **Strict Headless**: All automated E2E tests must be run in **Headless Mode** (`headless: true`) as configured in `playwright.config.ts`.
2. **Trace‑Driven Analysis**: In the event of a failure, agents must use **Playwright Traces** and **Screenshots** to analyze the visual state and report findings.
3. **Performant Assertions**: Avoid `waitForTimeout`. Use web‑first assertions like `expect().toBeVisible()` to allow the headless runner to maximum throughput.
4. **Hardware Acceleration**: Ensure launch options include `--enable-gpu` to match the rendering fidelity of headed browsers.

### 7.3. Performance Tools (Agent‑Only)

Use these tools to skip long manual debugging turns:

1. **System Health**: Run `npx tsx scripts/agent-doctor.ts` to verify environment and DB status before starting work.
2. **State Diagnostics**: Run `npx tsx scripts/explore-context.ts <email>` to see the exact DB state for a specific user.
3. **Math Consistency**: Use `@client/lib/formula-oracle.ts` for all HVAC calculations. Avoid ad‑hoc math logic.

## Related Skills

- [AI Engine Configuration](../03_development/architecture/ai_engine_config.md)
- [Native Automations](../03_development/architecture/native_automations.md)
- [AI Onboarding Context](../../AI_ONBOARDING.md) (Root‑level reference)

## Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Playwright Documentation](https://playwright.dev/)
- [DeepSeek API Documentation](https://platform.deepseek.com/api-docs/)
- [xAI Grok API Documentation](https://docs.x.ai/)
