# AI Engine Configuration

The application is currently configured to use **DeepSeek-V3.2-Speciale** as the default AI model for troubleshooting and recommendations.

## Configuration Details
- **Provider**: Ollama (Self-hosted/Local)
- **Model Name**: `DeepSeek-V3.2-Speciale`
- **Fallback**: Can be overridden via `OLLAMA_MODEL` environment variable.
- **Service**: Managed via Supabase Edge Functions (`ai-troubleshoot` and `recommended-range`).
