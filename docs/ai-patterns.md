# AI Pattern Recognition System

## Overview

The AI Pattern Recognition system is a comprehensive learning platform that analyzes HVAC troubleshooting data to identify patterns, provide intelligent recommendations, and continuously improve from technician feedback.

## Architecture

### Database Schema

#### `ai_learning_patterns` Table

Stores pattern data learned from historical troubleshooting sessions:

- `id`: UUID primary key
- `pattern_type`: One of 'symptom_outcome', 'equipment_failure', 'measurement_anomaly', 'seasonal_pattern'
- `pattern_data`: JSON object containing pattern-specific data
- `confidence_score`: 0-100 confidence rating
- `occurrence_count`: How many times this pattern has been observed
- `last_seen`: Timestamp of last occurrence
- `company_id`: Multi-tenant isolation
- `equipment_model`: Equipment model specificity
- `created_at/updated_at`: Automatic timestamps

#### `diagnostic_outcomes` Table

Stores feedback and outcomes from troubleshooting sessions:

- `id`: UUID primary key
- `troubleshooting_session_id`: Links to calculations table
- `ai_recommendations`: JSON of AI suggestions provided
- `technician_actions`: JSON of actions taken by technician
- `final_resolution`: JSON of final outcome
- `success_rating`: 1-5 technician rating
- `followup_required`: Boolean for follow-up needs
- `notes`: Text feedback
- `user_id`/`company_id`: Multi-tenant isolation
- `created_at`: Automatic timestamp

### Backend Services

#### PatternRecognitionService

Core service for pattern analysis and learning:

- `analyzeHistoricalData()`: Analyzes company's pattern history
- `getRelatedPatterns()`: Finds patterns matching current symptoms
- `calculateConfidence()`: Calculates pattern confidence scores
- `createSymptomOutcomePattern()`: Creates new patterns from successful/failed diagnoses
- `createMeasurementAnomalyPattern()`: Detects measurement anomalies
- `updatePattern()`: Updates patterns based on technician feedback

#### API Endpoints

All endpoints use `authenticateEither` for JWT/Supabase token validation:

- `POST /api/ai/patterns/analyze` - Analyze historical patterns
- `POST /api/ai/patterns/related` - Get patterns for current symptoms
- `POST /api/ai/patterns/symptom-outcome` - Create symptom patterns
- `POST /api/ai/patterns/measurement-anomaly` - Create measurement patterns
- `PUT /api/ai/patterns/:patternId/feedback` - Update pattern feedback
- `GET /api/ai/patterns/:companyId/:type` - Get patterns by type
- `POST /api/ai/enhanced-troubleshoot` - Enhanced troubleshooting with patterns

### Frontend Components

#### EnhancedTroubleshooting

Integrates AI pattern recognition into troubleshooting workflow:

- Real-time pattern matching as user enters symptoms
- Confidence scoring for each pattern match
- Actionable recommendations based on historical success
- Progress tracking and confidence visualization
- Feedback integration for continuous learning

#### PatternInsights

Analytics dashboard for pattern visibility:

- Total patterns by type and confidence
- Pattern occurrence trends over time
- Equipment reliability analysis
- Symptom correlation matrices
- Seasonal pattern analysis
- Export capabilities for reporting

#### TechnicianFeedback

Captures technician feedback for pattern learning:

- Simple thumbs up/down rating
- Diagnosis accuracy validation
- Outcome success tracking
- Text notes for additional context
- Rating scale (1-5) for quality assessment

## Pattern Types

### Symptom Outcome Patterns

Maps symptom combinations to successful/failed diagnoses:

```json
{
  "symptoms": ["no_cooling", "high_head_pressure"],
  "diagnosis": "Compressor failure",
  "outcome": "success",
  "equipment_model": "Trane XR16",
  "timestamp": "2024-02-04T10:30:00Z"
}
```

### Equipment Failure Patterns

Tracks failure modes by equipment model:

```json
{
  "equipment_model": "Trane XR16",
  "failure_modes": [
    {
      "symptom": "Compressor failure",
      "frequency": 0.15,
      "mean_time_to_failure": 3650,
      "recommended_replacement": "Compressor replacement"
    }
  ]
}
```

### Measurement Anomaly Patterns

Detects measurement values outside expected ranges:

```json
{
  "parameter": "suction_pressure",
  "measured_value": 150,
  "expected_range": { "min": 50, "max": 85 },
  "deviation_percent": 76.5,
  "diagnosis": "Low suction pressure"
}
```

### Seasonal Patterns

Identifies seasonal correlations in failures:

```json
{
  "season": "summer",
  "symptom_increase": [
    {
      "symptom": "no_cooling",
      "increase_percentage": 25,
      "contributing_factors": ["High ambient temperature", "Dirty condenser"]
    }
  ]
}
```

## Configuration

### Environment Variables

```bash
# Supabase Configuration (required)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=https://your-project.supabase.co/functions/v1
```

### Database Migration

Apply the migration to set up tables and RLS policies:

```bash
supabase db push
```

### Historical Data Migration

Migrate existing troubleshooting data to patterns:

```bash
npx tsx server/scripts/simple-pattern-migration.ts
```

## Security

### Row Level Security (RLS)

- Company isolation: Users can only access their company's patterns
- Service role: Full access for migrations and system operations
- Pattern ownership: Users can only modify patterns they created

### Authentication

- JWT token validation for API endpoints
- Supabase token support for modern auth
- Role-based access control for different user types

## Performance

### Database Optimization

- Indexes on company_id, pattern_type, equipment_model, last_seen
- Efficient JSON queries with GIN indexes on pattern_data
- Batch processing for historical migrations

### Caching Strategy

- Client-side caching of frequently accessed patterns
- Confidence score caching for repeated calculations
- Lazy loading of PatternInsights data

## Usage Examples

### Frontend Integration

```typescript
import { aiPatternsAPI } from "@/lib/ai-patterns";

// Get enhanced troubleshooting
const response = await aiPatternsAPI.enhancedTroubleshoot({
  symptoms: ["no_cooling", "high_head_pressure"],
  measurements: { suction_pressure: 150, head_pressure: 450 },
  equipmentModel: "Trane XR16",
  companyId: "company-uuid",
});

// Submit feedback
await aiPatternsAPI.updatePatternFeedback(patternId, {
  helpful: true,
  correct_diagnosis: true,
  technician_rating: 5,
  notes: "Successfully resolved issue",
});
```

### Backend Service Usage

```typescript
import { PatternRecognitionService } from "../services/PatternRecognitionService";

const patternService = new PatternRecognitionService();

// Analyze patterns
const analysis = await patternService.analyzeHistoricalData(companyId);

// Get related patterns
const patterns = await patternService.getRelatedPatterns(
  symptoms,
  equipmentModel,
  companyId,
);

// Create new pattern
const patternId = await patternService.createSymptomOutcomePattern(
  symptoms,
  diagnosis,
  "success",
  equipmentModel,
  companyId,
);
```

## Monitoring & Analytics

### Pattern Metrics

- Pattern creation rate by type
- Confidence score distribution
- Feedback acceptance rates
- Seasonal pattern effectiveness

### Performance Metrics

- API response times
- Database query performance
- Pattern matching accuracy
- User engagement with AI recommendations

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check Supabase environment variables
   - Verify database migration applied
   - Check RLS policies

2. **Patterns Not Loading**
   - Verify company ID is provided
   - Check authentication status
   - Review browser console for errors

3. **Low Confidence Scores**
   - Need more historical data
   - Check pattern quality and diversity
   - Verify symptom/measurement accuracy

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable
DEBUG_AI_PATTERNS = true;

// Check browser console for pattern matching details
console.log("Pattern matching:", response);
```

## Future Enhancements

### Planned Features

- Machine learning model integration for better pattern recognition
- Predictive maintenance based on pattern trends
- Equipment manufacturer integration for model-specific patterns
- Real-time collaboration between technicians

### API Versioning

- v1.0: Current implementation
- v1.1: Planned ML model integration
- v2.0: Predictive maintenance features

## Support

For issues or questions about the AI Pattern Recognition system:

1. Check this documentation first
2. Review console errors in browser
3. Check server logs for API issues
4. Verify database schema and RLS policies
5. Contact development team with detailed error information

---

**Last Updated**: 2026-02-04
**Version**: 1.0.0
**Compatible**: HVAC-R v1.1.51+
