---
description: Scans chat history and codebase to identify and reconcile out-of-date documentation in the `skills/` directory.
---

Use this workflow to ensure your "Skills" (documentation) always match the reality of the Code and the Decisions made in Chat.

### Phase 1: The Recursive Deep Audit 🕵️
The Agent will act as a thorough auditor to find ALL discrepancies at once.

1.  **Inventory & Code Scan**:
    *   **List all Skills**: Run `find skills/ -name "*.md"` to see the full scope of documentation.
    *   **Scan Recent Code**: Run `git diff --stat HEAD~10` (or check `task.md` history) to identify all recent features, components, and architectural changes.
    *   **Review Chat History**: Scan the entire active context for key decisions (e.g., "Switch to Telnyx", "Enable RLS").

2.  **Systematic Cross-Check**:
    *   **Iterate**: For *every* major feature identified in the Code Scan, find its corresponding Skill file.
    *   **Verify**: Does the Skill file describe the *current* implementation?
    *   **Identify Drift**: Note *every* instance where Code != Documentation.

### Phase 2: The Master Drift Report 📋
Do not report incrementally. Compile a **Single Comprehensive Report** containing ALL findings.

**Format**:
> **Master Skills Sync Report**
>
> **A. Strategy & Roadmap**
> 1.  **Drift**: Phase 2 is marked "In Progress" but code shows it's done.
>     *   *Action*: Mark Phase 2 as Complete in `master_execution_plan.md`.
>
> **B. Technical Architecture**
> 2.  **Drift**: `invoice-chaser` function exists but is not in `native_automations.md`.
>     *   *Action*: Add function documentation.
>
> **C. Business Logic**
> 3.  **Drift**: New `invoices` table not mentioned in `blueprint.md`.
>     *   *Action*: Update Business Engine section.

### Phase 3: User Confirmation 🛑
**STOP** and present the Master Report. Wait for the user to say "Execute All" or "Proceed".

### Phase 4: Batch Synchronization 🔄
Upon approval, the Agent will:
1.  **Batch Edits**: Use `multi_replace_file_content` to apply changes to ALL affected files in a systematic sequence.
2.  **Final Polish**: Run a final verify step to ensure no broken links remain.
3.  **Close**: Run `task_boundary` to confirm the library is 100% sync'd.
