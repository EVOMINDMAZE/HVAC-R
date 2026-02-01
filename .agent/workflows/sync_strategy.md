---
description: Scans chat history and codebase to identify and reconcile out-of-date documentation in the `skills/` directory.
---

Use this workflow to ensure your "Skills" (documentation) always match the reality of the Code and the Decisions made in Chat.

### Phase 1: Drift Detection 🕵️
The Agent will act as a detective to find discrepancies.

1.  **Run the "Triple Scan"**:
    The Agent MUST review three specific data sources to identify discrepancies:
    *   **A. Chat History**: What did the user *say*? (e.g., "Let's switch to Vultr").
    *   **B. Codebase**: What was *implemented*? (Check recent file changes, new env vars).
    *   **C. Skills Files**: What is *documented*? (Check `skills/` for outdated info).

2.  **Triangulate & Detect Drift**:
    *   Compare **Chat vs. Skills**: Did we decide something new that isn't written down?
    *   Compare **Code vs. Skills**: Does the code match the documentation?

### Phase 2: The Drift Report 📋
The Agent must present a summary of **Proposed Updates** before editing anything.

**Format**:
> **Skills Sync Report**
>
> 1.  **Detected Change**: Switched from DigitalOcean to Vultr.
>     *   *Source*: Chat History & `commercial_roadmap.md` edit.
>     *   *Impacted Skill*: `skills/01_strategy/cloud_strategy.md`.
>     *   *Proposed Action*: Replace "DigitalOcean" with "Vultr".
>
> 2.  **Detected Change**: Added `RENDER_API_KEY`.
>     *   *Source Code*: `scripts/list-render-services.js`.
>     *   *Impacted Skill*: `skills/03_development/render_service.md` (or `.env.example`).
>     *   *Proposed Action*: Document the new variable.

### Phase 3: User Confirmation 🛑
**STOP** and wait for the user to say "Go ahead" or "Approving 1 and 2".

### Phase 4: Synchronization 🔄
Upon approval, the Agent will:
1.  **Edit the Skills**: Use `multi_replace_file_content` or `write_to_file` to update the documentation.
2.  **Verify**: Ensure no broken links or inconsistent terms remain.
3.  **Finalize**: Run `task_boundary` to close the sync task.
