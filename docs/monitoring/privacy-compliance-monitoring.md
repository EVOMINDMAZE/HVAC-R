# Privacy Compliance Monitoring & Alerting

## Overview

Monitoring and alerting for GDPR/CCPA compliance features is critical for maintaining regulatory compliance and user trust. This document outlines the monitoring strategy for privacy endpoints, consent management, and Data Subject Rights (DSR) processing.

## Key Metrics to Monitor

### 1. Consent Management Metrics

- **Consent Recording Rate**: Number of consent records created per hour/day
- **Consent Check Latency**: P95/P99 response time for `/api/privacy/consent/check`
- **Consent Recording Errors**: Error rate for `POST /api/privacy/consent`
- **Consent Version Distribution**: Breakdown of consent versions across users

### 2. Data Subject Rights (DSR) Metrics

- **DSR Request Volume**: Number of DSR requests by type (access, deletion, correction, portability)
- **DSR Processing Time**: Time from request to completion (SLA: 30 days for GDPR)
- **DSR Error Rate**: Failed DSR requests
- **DSR Backlog**: Number of pending DSR requests

### 3. Data Export Metrics

- **Export Request Volume**: Number of data export requests
- **Export Generation Time**: Time to generate export files
- **Export Failure Rate**: Failed export requests
- **Export File Size**: Average size of export files

### 4. System Health Metrics

- **Privacy Endpoint Availability**: Uptime for all privacy endpoints
- **Response Time**: P95/P99 for all privacy endpoints
- **Error Rate**: 4xx/5xx error rates by endpoint
- **Authentication Failures**: Rate of 401/403 responses

## Alert Configuration

### Critical Alerts (Page Immediately)

#### 1. Privacy Endpoint Downtime

```yaml
alert: PrivacyEndpointDown
expr: rate(http_requests_total{path=~"/api/privacy/.*", status!~"5.."}[5m]) == 0
for: 2m
severity: critical
annotations:
  summary: "Privacy endpoints are completely down"
  description: "All privacy endpoints returning 0 successful requests for 2 minutes"
```

#### 2. High DSR Failure Rate

```yaml
alert: HighDSRFailureRate
expr: rate(http_requests_total{path="/api/privacy/dsr", status=~"5.."}[5m]) / rate(http_requests_total{path="/api/privacy/dsr"}[5m]) > 0.1
for: 5m
severity: critical
annotations:
  summary: "High failure rate for DSR requests"
  description: "More than 10% of DSR requests are failing"
```

#### 3. Consent Recording Failure

```yaml
alert: ConsentRecordingFailure
expr: rate(http_requests_total{path="/api/privacy/consent", method="POST", status=~"5.."}[5m]) > 0
for: 2m
severity: critical
annotations:
  summary: "Consent recording failures detected"
  description: "Errors occurring when recording user consents"
```

### Warning Alerts (Notify During Business Hours)

#### 1. Elevated Response Times

```yaml
alert: HighPrivacyEndpointLatency
expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{path=~"/api/privacy/.*"}[5m])) > 1
for: 10m
severity: warning
annotations:
  summary: "High latency for privacy endpoints"
  description: "P95 response time > 1 second for privacy endpoints"
```

#### 2. DSR Processing Backlog

```yaml
alert: DSRProcessingBacklog
expr: dsr_pending_requests > 50
for: 1h
severity: warning
annotations:
  summary: "DSR request backlog growing"
  description: "More than 50 DSR requests pending processing"
```

#### 3. Data Export Timeout Risk

```yaml
alert: ExportTimeoutRisk
expr: rate(export_generation_time_seconds[1h]) > 3600
for: 30m
severity: warning
annotations:
  summary: "Data export generation taking too long"
  description: "Export generation time exceeding 1 hour average"
```

## Logging Strategy

### Structured Log Fields for Privacy Events

```json
{
  "timestamp": "ISO-8601",
  "level": "INFO|WARN|ERROR",
  "service": "privacy-api",
  "event_type": "consent_recorded|dsr_requested|export_generated|consent_checked",
  "user_id": "uuid",
  "consent_type": "privacy|marketing|cookies",
  "consent_version": "1.0",
  "granted": true,
  "request_type": "access|deletion|correction|portability",
  "request_id": "uuid",
  "processing_time_ms": 123,
  "ip_address": "hash",
  "user_agent": "browser",
  "error": null
}
```

### Log Retention

- **Production**: 365 days for compliance audit trail
- **Staging**: 90 days
- **Development**: 30 days

## Dashboard Configuration

### Grafana Dashboard: Privacy Compliance

**Key Panels:**

1. **Consent Overview**
   - Consent recording rate (last 24h)
   - Consent check success rate
   - Top consent types

2. **DSR Processing**
   - DSR requests by type (last 7 days)
   - Average processing time
   - Pending requests backlog

3. **System Performance**
   - Privacy endpoint response times (P95)
   - Error rates by endpoint
   - Request volume trends

4. **Compliance SLA**
   - DSR processing within 30 days
   - Export generation within 48 hours
   - Consent recording success rate > 99.9%

## Incident Response Procedures

### Privacy Incident Classification

| Severity | Criteria | Response Time |
|----------|----------|---------------|
| SEV-1 | Privacy endpoint completely down, DSR failures > 50% | 15 minutes |
| SEV-2 | High latency (>5s), Consent recording failures | 1 hour |
| SEV-3 | Warning alerts, Non-critical issues | 4 hours |

### Escalation Path

1. **Primary**: Engineering on-call
2. **Secondary**: Privacy Officer / Legal team
3. **Tertiary**: CTO / Head of Engineering

### Post-Incident Actions

1. Root cause analysis documented
2. Privacy impact assessment conducted
3. Regulatory reporting if required (72 hours for GDPR)
4. Process improvements implemented

## Testing Monitoring & Alerts

### Regular Testing Schedule

- **Weekly**: Alert firing test (non-production)
- **Monthly**: Full incident response drill
- **Quarterly**: Compliance audit of monitoring coverage

### Synthetic Monitoring

```javascript
// Example synthetic check for privacy endpoints
const checks = [
  {
    name: "consent-recording",
    endpoint: "/api/privacy/consent",
    method: "POST",
    frequency: "5m",
    validate: (response) => response.status === 401 // Expect 401 without auth
  },
  {
    name: "consent-check",
    endpoint: "/api/privacy/consent/check?consent_type=privacy",
    method: "GET",
    frequency: "5m",
    validate: (response) => response.status === 401
  }
];
```

## Compliance Reporting

### Automated Reports

- **Daily**: Consent metrics, DSR processing status
- **Weekly**: Compliance dashboard sent to Privacy Officer
- **Monthly**: Full compliance report for legal team

### Audit Trail

All privacy-related actions are logged to:

1. Application database (`user_consents` table)
2. Centralized logging (ELK/Splunk)
3. Backup to secure cold storage for 7 years

## Integration with Existing Monitoring Stack

### Prometheus Metrics Exported

```javascript
// Privacy-specific metrics
const privacyMetrics = {
  http_requests_total: 'Counter of HTTP requests to privacy endpoints',
  http_request_duration_seconds: 'Histogram of request durations',
  consent_records_total: 'Counter of consent records created',
  dsr_requests_total: 'Counter of DSR requests by type',
  export_requests_total: 'Counter of export requests',
  pending_dsr_requests: 'Gauge of pending DSR requests'
};
```

### Alert Manager Routes

```yaml
routes:
  - match:
      severity: critical
    receiver: privacy-pagerduty
    group_wait: 30s
    group_interval: 5m
    repeat_interval: 1h
    
  - match:
      severity: warning
    receiver: privacy-slack
    group_wait: 1m
    group_interval: 10m
```

## Continuous Improvement

### Review Cycle

- **Monthly**: Review alert effectiveness, adjust thresholds
- **Quarterly**: Update monitoring based on regulatory changes
- **Annually**: Full review of privacy monitoring strategy

### Feedback Loop

1. Incident post-mortems inform monitoring improvements
2. Privacy team feedback incorporated
3. Regulatory changes trigger monitoring updates

---

*Last Updated: 2026-02-07*  
*Owner: Privacy Engineering Team*  
*Review Schedule: Quarterly*
