# ELK Stack Setup Guide

**Date:** 2026-02-07  
**Version:** 1.0

## Overview

This guide describes how to set up the ELK (Elasticsearch, Logstash, Kibana) stack for log aggregation and analysis in the ThermoNeural application.

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- At least 4GB RAM available for ELK services
- 10GB disk space

## Quick Start

### 1. Start the ELK Stack

```bash
cd docker/elk
docker-compose up -d
```

### 2. Verify Services

```bash
# Check container status
docker-compose ps

# Check Elasticsearch
curl http://localhost:9200/_cluster/health

# Check Kibana
curl http://localhost:5601/api/status
```

### 3. Access Kibana

Open your browser and navigate to: <http://localhost:5601>

## Configuration Files

### Directory Structure

```
docker/elk/
├── docker-compose.yml          # Main orchestration file
├── filebeat/
│   └── filebeat.yml           # Filebeat configuration
├── logstash/
│   ├── config/
│   │   └── logstash.yml       # Logstash settings
│   └── pipeline/
│       └── logstash.conf      # Processing pipeline
└── kibana/
    └── config/
        └── kibana.yml         # Kibana settings
```

## Services

### Elasticsearch

- **Port:** 9200 (HTTP), 9300 (Transport)
- **Purpose:** Search and analytics engine
- **Memory:** 2GB heap (configurable in docker-compose.yml)

### Logstash

- **Port:** 5000 (Beats), 5001 (TCP), 8080 (HTTP)
- **Purpose:** Data processing pipeline
- **Features:**
  - JSON parsing
  - GeoIP enrichment
  - User agent parsing
  - Timestamp normalization
  - Error/success tagging

### Kibana

- **Port:** 5601
- **Purpose:** Visualization and dashboarding
- **Access:** <http://localhost:5601>

### Filebeat

- **Purpose:** Log shipping
- **Monitors:** Docker containers and log files

## Log Shipping

### From Node.js Application

Send logs to Logstash via HTTP:

```javascript
const logToELK = async (logData) => {
  const response = await fetch('http://localhost:8080', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      level: logData.level,
      message: logData.message,
      service: 'thermoneural-api',
      environment: process.env.NODE_ENV,
      userId: logData.userId,
      requestId: logData.requestId,
      endpoint: logData.endpoint,
      duration: logData.duration,
      statusCode: logData.statusCode,
      ...logData.context
    })
  });
  return response.json();
};
```

### From Express Middleware

```javascript
const logToELK = require('./lib/elkLogger');

app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logToELK({
      level: res.statusCode >= 400 ? 'ERROR' : 'INFO',
      message: `${req.method} ${req.path}`,
      service: 'thermoneural-api',
      userId: req.user?.id,
      requestId: req.requestId,
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
});
```

## Index Patterns

The ELK stack creates the following indices:

| Index Pattern | Description |
|--------------|-------------|
| `thermoneural-logs-*` | All application logs |
| `thermoneural-errors-*` | Error and exception logs |
| `thermoneural-security-*` | Security-related events |

## Kibana Dashboards

### Pre-configured Dashboards

1. **Application Overview** - General application metrics
2. **Error Analysis** - Error tracking and trends
3. **Security Events** - Authentication and authorization logs
4. **API Performance** - Request timing and latency
5. **User Activity** - User behavior and navigation

### Creating Index Patterns

1. Navigate to **Stack Management** → **Index Patterns**
2. Create pattern: `thermoneural-logs-*`
3. Set `@timestamp` as the time field
4. Repeat for `thermoneural-errors-*` and `thermoneural-security-*`

## Log Format

### Expected Log Structure

```json
{
  "timestamp": "2026-02-07T10:30:00.000Z",
  "level": "INFO",
  "message": "User logged in",
  "service": "thermoneural-api",
  "environment": "production",
  "userId": "user-123",
  "requestId": "req-456",
  "endpoint": "/api/auth/signin",
  "method": "POST",
  "statusCode": 200,
  "duration": 150,
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "geoip": {
    "country_code2": "US",
    "city_name": "New York"
  }
}
```

## Troubleshooting

### Services Not Starting

```bash
# Check logs
docker-compose logs elasticsearch
docker-compose logs logstash
docker-compose logs kibana

# Check disk space
df -h

# Check memory
docker stats
```

### Elasticsearch Out of Memory

Edit `docker-compose.yml` and reduce the heap size:

```yaml
environment:
  - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
```

### Kibana Unable to Connect

```bash
# Verify Elasticsearch is running
curl http://localhost:9200/_cluster/health

# Check network connectivity
docker network inspect elk-network
```

## Production Deployment

### Recommended Resources

| Service | CPU | Memory | Storage |
|---------|-----|--------|---------|
| Elasticsearch | 2 cores | 4GB | 50GB SSD |
| Logstash | 1 core | 2GB | 10GB |
| Kibana | 1 core | 1GB | 10GB |

### Security Considerations

1. **Enable TLS/SSL**
2. **Configure Authentication**
3. **Set Up Role-Based Access**
4. **Enable Audit Logging**

### Example Production docker-compose.yml

```yaml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - node.name=es01
      - cluster.name=thermoneural-logs
      - discovery.type=single-node
      - bootstrap.memory_lock=true
      - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
      - xpack.security.enabled=true
      - xpack.security.http.ssl.enabled=true
      - xpack.security.transport.ssl.enabled=true
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
      - ./certs:/usr/share/elasticsearch/config/certs
    ports:
      - "9200:9200"
    ulimits:
      memlock:
        soft: -1
        hard: -1

volumes:
  elasticsearch-data:
    driver: local
```

## Maintenance

### Index Management

```bash
# View indices
curl http://localhost:9200/_cat/indices?v

# Delete old indices (older than 30 days)
curl -X DELETE "localhost:9200/thermoneural-logs-$(date -d '30 days ago' +%Y.%m.%d)"

# Force merge indices
curl -X POST "localhost:9200/thermoneural-logs-*/_forcemerge?max_num_segments=1"
```

### Backup and Restore

```bash
# Create snapshot repository
curl -X PUT "localhost:9200/_snapshot/backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/usr/share/elasticsearch/backups"
  }
}'

# Create snapshot
curl -X PUT "localhost:9200/_snapshot/backup/snapshot_2026_02_07"

# Restore snapshot
curl -X POST "localhost:9200/_snapshot/backup/snapshot_2026_02_07/_restore"
```

## Monitoring

### Health Check

```bash
# Cluster health
curl http://localhost:9200/_cluster/health

# Node stats
curl http://localhost:9200/_nodes/stats

# Index stats
curl http://localhost:9200/_stats
```

## Cost Optimization

### Suggested Optimizations

1. **Use ILM (Index Lifecycle Management)** to automatically roll over and delete indices
2. **Reduce replica count** for development environments
3. **Use cheaper storage** for old indices (cold tier)
4. **Implement data retention policies** (30 days for logs, 1 year for errors)

### ILM Policy Example

```json
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_size": "50gb"
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": {
            "number_of_shards": 1
          },
          "forcemerge": {
            "max_num_segments": 1
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "freeze": {}
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
```

## Support

For issues with the ELK stack:

1. Check Docker logs: `docker-compose logs <service>`
2. Review Kibana status: <http://localhost:5601/api/status>
3. Consult Elasticsearch documentation: <https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html>

---

*Document Version: 1.0*  
*Created: 2026-02-07*  
*Next Review: 2026-05-07*
