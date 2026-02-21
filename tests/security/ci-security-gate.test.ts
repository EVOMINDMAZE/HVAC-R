import { describe, it, expect } from "vitest";
import { evaluateAuditReport } from "../../scripts/security/ci-security-gate.js";

describe("evaluateAuditReport", () => {
    it("passes when no vulnerabilities found", () => {
        const result = evaluateAuditReport(
            {
                metadata: {
                    vulnerabilities: { total: 0, critical: 0, high: 0, moderate: 0, low: 0 },
                },
            },
            []
        );

        expect(result.ok).toBe(true);
        expect(result.critical).toBe(0);
        expect(result.high).toBe(0);
        expect(result.blocked).toHaveLength(0);
    });

    it("fails on unallowlisted high severity findings", () => {
        const result = evaluateAuditReport(
            {
                metadata: {
                    vulnerabilities: { total: 1, critical: 0, high: 1, moderate: 0, low: 0 },
                },
                advisories: {
                    123: {
                        id: 123,
                        module_name: "vulnerable-package",
                        severity: "high",
                        title: "Prototype Pollution",
                        url: "https://example.com/advisory/123",
                        findings: [{ paths: ["node_modules/vulnerable-package"] }],
                    },
                },
            },
            []
        );

        expect(result.ok).toBe(false);
        expect(result.high).toBe(1);
        expect(result.blocked).toHaveLength(1);
        expect(result.blocked[0].module).toBe("vulnerable-package");
    });

    it("fails on unallowlisted critical severity findings", () => {
        const result = evaluateAuditReport(
            {
                metadata: {
                    vulnerabilities: { total: 1, critical: 1, high: 0, moderate: 0, low: 0 },
                },
                advisories: {
                    456: {
                        id: 456,
                        module_name: "critical-package",
                        severity: "critical",
                        title: "Remote Code Execution",
                        url: "https://example.com/advisory/456",
                        findings: [{ paths: ["node_modules/critical-package"] }],
                    },
                },
            },
            []
        );

        expect(result.ok).toBe(false);
        expect(result.critical).toBe(1);
        expect(result.blocked[0].severity).toBe("critical");
    });

    it("passes when high severity is in allowlist", () => {
        const result = evaluateAuditReport(
            {
                metadata: {
                    vulnerabilities: { total: 1, critical: 0, high: 1, moderate: 0, low: 0 },
                },
                advisories: {
                    789: {
                        id: 789,
                        module_name: "xlsx",
                        severity: "high",
                        title: "Prototype Pollution",
                        url: "https://example.com/advisory/789",
                        findings: [{ paths: ["node_modules/xlsx"] }],
                    },
                },
            },
            [
                {
                    id: 789,
                    reason: "Waiting for upstream fix - see VULNERABILITY_REPORT.md",
                    expires: "2026-06-01T00:00:00Z",
                    severity: "high",
                },
            ]
        );

        expect(result.ok).toBe(true);
        expect(result.allowlisted).toHaveLength(1);
        expect(result.allowlisted[0].module).toBe("xlsx");
        expect(result.blocked).toHaveLength(0);
    });

    it("fails when allowlist entry is expired", () => {
        const result = evaluateAuditReport(
            {
                metadata: {
                    vulnerabilities: { total: 1, critical: 0, high: 1, moderate: 0, low: 0 },
                },
                advisories: {
                    999: {
                        id: 999,
                        module_name: "expired-allowlist",
                        severity: "high",
                        title: "Some Vulnerability",
                        url: "https://example.com/advisory/999",
                        findings: [{ paths: ["node_modules/expired-allowlist"] }],
                    },
                },
            },
            [
                {
                    id: 999,
                    reason: "This entry has expired",
                    expires: "2020-01-01T00:00:00Z", // Expired
                    severity: "high",
                },
            ]
        );

        expect(result.ok).toBe(false);
        expect(result.expiredAllowlist).toHaveLength(1);
        expect(result.blocked).toHaveLength(1);
    });

    it("passes for moderate and low severity without allowlist", () => {
        const result = evaluateAuditReport(
            {
                metadata: {
                    vulnerabilities: { total: 2, critical: 0, high: 0, moderate: 1, low: 1 },
                },
                advisories: {
                    100: {
                        id: 100,
                        module_name: "moderate-package",
                        severity: "moderate",
                        title: "Moderate Issue",
                        url: "https://example.com/advisory/100",
                        findings: [{ paths: ["node_modules/moderate-package"] }],
                    },
                    101: {
                        id: 101,
                        module_name: "low-package",
                        severity: "low",
                        title: "Low Issue",
                        url: "https://example.com/advisory/101",
                        findings: [{ paths: ["node_modules/low-package"] }],
                    },
                },
            },
            []
        );

        expect(result.ok).toBe(true);
        expect(result.moderate).toBe(1);
        expect(result.low).toBe(1);
        expect(result.blocked).toHaveLength(0);
    });

    it("handles null audit input gracefully", () => {
        const result = evaluateAuditReport(null, []);

        expect(result.ok).toBe(false);
    });

    it("handles missing metadata gracefully", () => {
        const result = evaluateAuditReport({}, []);

        expect(result.ok).toBe(true);
        expect(result.critical).toBe(0);
        expect(result.high).toBe(0);
    });

    it("handles missing advisories with high count", () => {
        const result = evaluateAuditReport(
            {
                metadata: {
                    vulnerabilities: { total: 2, critical: 1, high: 1, moderate: 0, low: 0 },
                },
            },
            []
        );

        // Should fail when high/critical counts exist without advisories
        expect(result.ok).toBe(false);
        expect(result.critical).toBe(1);
        expect(result.high).toBe(1);
    });

    it("allows high/critical counts when fully allowlisted", () => {
        const result = evaluateAuditReport(
            {
                metadata: {
                    vulnerabilities: { total: 2, critical: 1, high: 1, moderate: 0, low: 0 },
                },
            },
            [
                {
                    id: "critical-1",
                    reason: "Known issue with mitigation",
                    expires: "2026-12-01T00:00:00Z",
                    severity: "critical",
                },
                {
                    id: "high-1",
                    reason: "Known issue with mitigation",
                    expires: "2026-12-01T00:00:00Z",
                    severity: "high",
                },
            ]
        );

        // Should pass when allowlist covers all high/critical
        expect(result.ok).toBe(true);
    });
});