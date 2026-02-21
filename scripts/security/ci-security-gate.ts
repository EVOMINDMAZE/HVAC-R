#!/usr/bin/env node
/**
 * CI Security Gate - Evaluates npm audit results against security policy
 *
 * This script runs as part of CI to enforce security standards:
 * - Blocks on unallowlisted high/critical vulnerabilities
 * - Reports moderate/low vulnerabilities for awareness
 * - Integrates with security-audit-allowlist.json for known exceptions
 *
 * Usage:
 *   node --loader tsx scripts/security/ci-security-gate.ts <audit-json-path> [allowlist-json-path]
 *
 * Exit codes:
 *   0 - Security gate passed
 *   1 - Security gate failed (blocking vulnerabilities found)
 *   2 - Configuration error
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

interface AuditMetadata {
    vulnerabilities: {
        total?: number;
        critical?: number;
        high?: number;
        moderate?: number;
        low?: number;
        info?: number;
    };
}

interface AuditAdvisory {
    id: number;
    module_name: string;
    severity: string;
    title: string;
    url: string;
    findings: Array<{
        paths: string[];
    }>;
}

interface NpmAuditJson {
    metadata?: AuditMetadata;
    advisories?: Record<number, AuditAdvisory>;
}

interface AllowlistEntry {
    id: number | string;
    reason: string;
    expires: string; // ISO date string
    severity: string;
}

interface AllowlistConfig {
    version: string;
    entries: AllowlistEntry[];
}

interface SecurityGateResult {
    ok: boolean;
    critical: number;
    high: number;
    moderate: number;
    low: number;
    blocked: Array<{
        id: number;
        module: string;
        severity: string;
        title: string;
    }>;
    allowlisted: Array<{
        id: number;
        module: string;
        severity: string;
        reason: string;
    }>;
    expiredAllowlist: Array<{
        id: number;
        module: string;
        reason: string;
        expiredDate: string;
    }>;
}

/**
 * Evaluates npm audit report against security policy
 */
export function evaluateAuditReport(
    auditJson: NpmAuditJson | null,
    allowlist: AllowlistEntry[]
): SecurityGateResult {
    const result: SecurityGateResult = {
        ok: true,
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
        blocked: [],
        allowlisted: [],
        expiredAllowlist: [],
    };

    if (!auditJson) {
        result.ok = false;
        return result;
    }

    // Extract vulnerability counts from metadata
    const vulns = auditJson.metadata?.vulnerabilities || {};
    result.critical = vulns.critical || 0;
    result.high = vulns.high || 0;
    result.moderate = vulns.moderate || 0;
    result.low = vulns.low || 0;

    // Build allowlist lookup with expiration check
    const now = new Date();
    const activeAllowlist = new Map<string, AllowlistEntry>();
    const expiredEntries: AllowlistEntry[] = [];

    for (const entry of allowlist) {
        const expiryDate = new Date(entry.expires);
        if (expiryDate < now) {
            expiredEntries.push(entry);
        } else {
            activeAllowlist.set(String(entry.id), entry);
        }
    }

    // Check advisories for blocking vulnerabilities
    if (auditJson.advisories) {
        for (const [id, advisory] of Object.entries(auditJson.advisories)) {
            const severity = advisory.severity.toLowerCase();
            const advisoryId = Number(id);

            // Only block on critical and high severity
            if (severity === "critical" || severity === "high") {
                const allowlistEntry = activeAllowlist.get(id);

                if (allowlistEntry) {
                    result.allowlisted.push({
                        id: advisoryId,
                        module: advisory.module_name,
                        severity: advisory.severity,
                        reason: allowlistEntry.reason,
                    });
                } else {
                    result.blocked.push({
                        id: advisoryId,
                        module: advisory.module_name,
                        severity: advisory.severity,
                        title: advisory.title,
                    });
                    result.ok = false;
                }
            }
        }
    }

    // Report expired allowlist entries
    for (const entry of expiredEntries) {
        result.expiredAllowlist.push({
            id: Number(entry.id),
            module: "unknown",
            reason: entry.reason,
            expiredDate: entry.expires,
        });
    }

    // If no advisories but we have high/critical counts, block on counts alone
    if (!auditJson.advisories && (result.critical > 0 || result.high > 0)) {
        // Check if all high/critical are allowlisted
        const totalBlocking = result.critical + result.high;
        if (totalBlocking > allowlist.length) {
            result.ok = false;
        }
    }

    return result;
}

/**
 * Loads and parses JSON file
 */
function loadJsonFile<T>(filePath: string): T | null {
    try {
        const absolutePath = resolve(filePath);
        if (!existsSync(absolutePath)) {
            return null;
        }
        const content = readFileSync(absolutePath, "utf-8");
        return JSON.parse(content) as T;
    } catch (error) {
        console.error(`Error loading ${filePath}:`, error);
        return null;
    }
}

/**
 * Formats security gate result for console output
 */
function formatResult(result: SecurityGateResult): string {
    const lines: string[] = [];

    lines.push("\n========================================");
    lines.push("       SECURITY GATE REPORT");
    lines.push("========================================\n");

    // Summary
    lines.push("Vulnerability Summary:");
    lines.push(`  Critical: ${result.critical}`);
    lines.push(`  High:     ${result.high}`);
    lines.push(`  Moderate: ${result.moderate}`);
    lines.push(`  Low:      ${result.low}`);
    lines.push("");

    // Blocked vulnerabilities
    if (result.blocked.length > 0) {
        lines.push("🚫 BLOCKED VULNERABILITIES:");
        for (const vuln of result.blocked) {
            lines.push(`  [${vuln.severity.toUpperCase()}] ${vuln.module} (ID: ${vuln.id})`);
            lines.push(`    ${vuln.title}`);
        }
        lines.push("");
    }

    // Allowlisted vulnerabilities
    if (result.allowlisted.length > 0) {
        lines.push("✅ ALLOWLISTED VULNERABILITIES:");
        for (const vuln of result.allowlisted) {
            lines.push(`  [${vuln.severity.toUpperCase()}] ${vuln.module} (ID: ${vuln.id})`);
            lines.push(`    Reason: ${vuln.reason}`);
        }
        lines.push("");
    }

    // Expired allowlist entries
    if (result.expiredAllowlist.length > 0) {
        lines.push("⚠️  EXPIRED ALLOWLIST ENTRIES:");
        for (const entry of result.expiredAllowlist) {
            lines.push(`  ID ${entry.id}: Expired on ${entry.expiredDate}`);
            lines.push(`    Reason was: ${entry.reason}`);
        }
        lines.push("");
    }

    // Final status
    lines.push("----------------------------------------");
    if (result.ok) {
        lines.push("✅ SECURITY GATE PASSED");
    } else {
        lines.push("🚫 SECURITY GATE FAILED");
        lines.push("");
        lines.push("Action required:");
        lines.push("  1. Fix the blocked vulnerabilities, OR");
        lines.push("  2. Add entries to .github/security-audit-allowlist.json");
        lines.push("     with justification and expiration date");
    }
    lines.push("========================================\n");

    return lines.join("\n");
}

/**
 * Main entry point
 */
async function main(): Promise<number> {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.error("Usage: ci-security-gate.ts <audit-json-path> [allowlist-json-path]");
        return 2;
    }

    const auditPath = args[0];
    const allowlistPath = args[1] || ".github/security-audit-allowlist.json";

    // Load audit report
    const auditJson = loadJsonFile<NpmAuditJson>(auditPath);
    if (!auditJson) {
        console.error(`Error: Could not load audit report from ${auditPath}`);
        console.error("Run: npm audit --json > output/audit.json");
        return 2;
    }

    // Load allowlist (optional)
    const allowlistConfig = loadJsonFile<AllowlistConfig>(allowlistPath);
    const allowlist = allowlistConfig?.entries || [];

    // Evaluate
    const result = evaluateAuditReport(auditJson, allowlist);

    // Output report
    console.log(formatResult(result));

    // Exit with appropriate code
    return result.ok ? 0 : 1;
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main()
        .then((code) => {
            process.exit(code);
        })
        .catch((error) => {
            console.error("Fatal error:", error);
            process.exit(2);
        });
}

export { SecurityGateResult, AllowlistEntry, AllowlistConfig, NpmAuditJson };