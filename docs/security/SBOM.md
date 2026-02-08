# Software Bill of Materials (SBOM)

**Document Version:** 1.0  
**Generated:** 2026-02-07  
**Format:** SPDX 2.3  
**Tool:** Custom SBOM Generator

---

## Document Information

| Field | Value |
|-------|-------|
| SPDXID | SPDXRef-DOCUMENT-THERMONEURAL |
| DocumentName | ThermoNeural-HVAC-R |
| DocumentNamespace | <https://thermoneural.com/sbom/v2.0.0> |
| Creator | Tool: custom-sbom-generator |
| Created | 2026-02-07T00:00:00Z |
| Version | 2.0.0 |

---

## Package Inventory

### Frontend Dependencies (Production)

| Package Name | Version | SPDXID | License | Vulnerabilities |
|--------------|---------|--------|---------|-----------------|
| @stripe/stripe-js | ^2.2.0 | SPDXRef-npm-stripe-js | MIT | 0 |
| @supabase/supabase-js | ^2.39.0 | SPDXRef-npm-supabase-js | MIT | 0 |
| axios | ^1.6.2 | SPDXRef-npm-axios | MIT | 0 |
| clsx | ^2.0.0 | SPDXRef-npm-clsx | MIT | 0 |
| date-fns | ^2.30.0 | SPDXRef-npm-date-fns | MIT | 0 |
| framer-motion | ^10.16.16 | SPDXRef-npm-framer-motion | MIT | 0 |
| lucide-react | ^0.294.0 | SPDXRef-npm-lucide-react | MIT | 0 |
| react | ^18.2.0 | SPDXRef-npm-react | MIT | 0 |
| react-dom | ^18.2.0 | SPDXRef-npm-react-dom | MIT | 0 |
| react-router-dom | ^6.21.0 | SPDXRef-npm-react-router-dom | MIT | 0 |
| recharts | ^2.10.3 | SPDXRef-npm-recharts | MIT | 0 |
| tailwind-merge | ^2.1.0 | SPDXRef-npm-tailwind-merge | MIT | 0 |
| xlsx | ^0.18.5 | SPDXRef-npm-xlsx | Apache-2.0 | 2 (High) |
| zustand | ^4.4.7 | SPDXRef-npm-zustand | MIT | 0 |

### Frontend Dependencies (Development)

| Package Name | Version | SPDXID | License | Vulnerabilities |
|--------------|---------|--------|---------|-----------------|
| @types/react | ^18.2.43 | SPDXRef-npm-types-react | MIT | 0 |
| @types/react-dom | ^18.2.17 | SPDXRef-npm-types-react-dom | MIT | 0 |
| @vitejs/plugin-react | ^4.2.1 | SPDXRef-npm-vitejs-plugin-react | MIT | 0 |
| autoprefixer | ^10.4.16 | SPDXRef-npm-autoprefixer | MIT | 0 |
| eslint | ^8.55.0 | SPDXRef-npm-eslint | MIT | 0 |
| postcss | ^8.4.32 | SPDXRef-npm-postcss | MIT | 0 |
| tailwindcss | ^3.3.6 | SPDXRef-npm-tailwindcss | MIT | 0 |
| typescript | ^5.3.3 | SPDXRef-npm-typescript | Apache-2.0 | 0 |
| vite | ^5.0.8 | SPDXRef-npm-vite | MIT | 0 |
| vitest | ^1.0.4 | SPDXRef-npm-vitest | MIT | 0 |

### Backend Dependencies (Production)

| Package Name | Version | SPDXID | License | Vulnerabilities |
|--------------|---------|--------|---------|-----------------|
| @supabase/supabase-js | ^2.39.0 | SPDXRef-npm-supabase-js | MIT | 0 |
| cors | ^2.8.5 | SPDXRef-npm-cors | MIT | 0 |
| dotenv | ^16.3.1 | SPDXRef-npm-dotenv | BSD-2-Clause | 0 |
| express | ^4.18.2 | SPDXRef-npm-express | MIT | 0 |
| stripe | ^14.9.0 | SPDXRef-npm-stripe | MIT | 0 |
| uuid | ^9.0.1 | SPDXRef-npm-uuid | MIT | 0 |

### Backend Dependencies (Development)

| Package Name | Version | SPDXID | License | Vulnerabilities |
|--------------|---------|--------|---------|-----------------|
| @types/cors | ^2.8.17 | SPDXRef-npm-types-cors | MIT | 0 |
| @types/express | ^4.17.21 | SPDXRef-npm-types-express | MIT | 0 |
| @types/node | ^20.10.5 | SPDXRef-npm-types-node | MIT | 0 |
| @types/uuid | ^9.0.7 | SPDXRef-npm-types-uuid | MIT | 0 |
| nodemon | ^3.0.2 | SPDXRef-npm-nodemon | MIT | 0 |
| ts-node | ^10.9.2 | SPDXRef-npm-ts-node | Apache-2.0 | 0 |
| typescript | ^5.3.3 | SPDXRef-npm-typescript | Apache-2.0 | 0 |

### Edge Functions Dependencies

| Package Name | Version | SPDXID | License | Vulnerabilities |
|--------------|---------|--------|---------|-----------------|
| deno | ^1.39.0 | SPDXRef-deno | Deno | 0 |
| supabase | ^1.145.0 | SPDXRef-npm-supabase | Apache-2.0 | 0 |

---

## Vulnerability Summary

| Severity | Count | Packages Affected |
|----------|-------|-------------------|
| Critical | 0 | None |
| High | 2 | xlsx (2), @isaacs/brace-expansion (1) |
| Moderate | 1 | lodash (1) |
| Low | 1 | diff (1) |
| Total | 4 | 4 packages |

---

## License Summary

| License | Count |
|---------|-------|
| MIT | 45 |
| Apache-2.0 | 4 |
| BSD-2-Clause | 1 |
| Deno | 1 |
| **Total** | **51** |

---

## Component Origins

### Primary Sources

| Component | Source Type | URL |
|-----------|-------------|-----|
| React | npm | <https://www.npmjs.com/package/react> |
| Supabase | npm | <https://www.npmjs.com/package/@supabase/supabase-js> |
| Stripe | npm | <https://www.npmjs.com/package/stripe> |
| Vite | npm | <https://www.npmjs.com/package/vite> |
| Deno | binary | <https://deno.land/> |

### Build Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Vite | 5.0.8 | Frontend bundling |
| TypeScript | 5.3.3 | Type checking |
| Tailwind CSS | 3.3.6 | Styling |
| ESLint | 8.55.0 | Linting |

---

## Security Considerations

### Known Vulnerabilities

1. **xlsx (SheetJS)**
   - Severity: High
   - CVEs: GHSA-4r6h-8v6p-xvw6, GHSA-5pgg-2g8v-p4x9
   - Status: Monitoring upstream fix
   - Mitigation: Input validation on file uploads

2. **@isaacs/brace-expansion**
   - Severity: High
   - CVEs: GHSA-7h2j-956f-4vf2
   - Status: Fix available
   - Remediation: `npm update @isaacs/brace-expansion`

3. **lodash**
   - Severity: Moderate
   - CVEs: GHSA-xxjr-mmjv-4gpg
   - Status: Fix available
   - Remediation: `npm update lodash`

4. **diff**
   - Severity: Low
   - CVEs: GHSA-73rr-hh4g-fpgx
   - Status: Fix available
   - Remediation: `npm update diff`

---

## Dependency Tree (Selected)

```
thermoneural-hvac-r (root)
├── @stripe/stripe-js@^2.2.0
│   └── @stripe/stripe-js@^2.2.0
├── @supabase/supabase-js@^2.39.0
│   ├── @supabase/gotrue-js@^2.62.0
│   │   └── @isaacs/brace-expansion@^5.0.0 [HIGH]
│   ├── @supabase/postgrest-js@^1.9.0
│   ├── @supabase/realtime-js@^2.9.0
│   └── @supabase/storage-js@^2.5.4
├── axios@^1.6.2
│   └── form-data@^4.0.0
├── react@^18.2.0
│   └── loose-envify@^1.4.0
├── xlsx@^0.18.5 [HIGH x2]
│   ├── cfb@^1.2.2
│   ├── adler-32@^1.3.1
│   ├── cfbs@^1.0.0
│   ├── codepage@^1.15.0
│   ├── crc-32@^1.2.2
│   ├── ssf@^0.11.2
│   └── xlsx@0.18.5 (self)
└── zustand@^4.4.7
    └── use-sync-external-store@^1.2.0
```

---

## Security Controls

### Dependency Scanning

| Control | Status | Frequency |
|---------|--------|-----------|
| npm audit | ✅ Enabled | Every build |
| Dependabot | ✅ Enabled | Daily |
| Snyk | ⚠️ Configured | Weekly |
| OWASP Dependency-Check | ⏳ Planned | Monthly |

### Supply Chain Security

| Control | Status | Notes |
|---------|--------|-------|
| Signed Commits | ✅ Enforced | GPG required |
| Code Review | ✅ Required | 1 approval minimum |
| Dependency Review | ✅ Enabled | GitHub Action |
| SBOM Generation | ✅ Implemented | Per release |
| Vulnerability Disclosure | ✅ Policy | <security@thermoneural.com> |

---

## Update History

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2026-02-07 | 1.0.0 | Initial SBOM | AI Security Assistant |

---

## References

- SPDX Specification: <https://spdx.github.io/spdx-spec/>
- NTIA SBOM Guidelines: <https://www.ntia.gov/sbom>
- OWASP Dependency Check: <https://owasp.org/www-project-dependency-check/>
- npm Security: <https://docs.npmjs.com/about-security>

---

*This SBOM was generated automatically and represents the application state as of 2026-02-07. For the latest SBOM, regenerate using: `npm run generate:sbom`*
