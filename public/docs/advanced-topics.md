# Advanced Topics

This section covers advanced features and workflows for power users and system integrators.

## Custom Properties

You can define custom refrigerant property sets for proprietary fluids — these are advanced features and typically require engineering validation.

## Batch Processing

For large-scale studies, batch requests can be executed by calling the standard cycle endpoint repeatedly or using the comparison endpoint to process multiple refrigerants in parallel.

## Data Export

- Export CSV for numerical analysis and PDF for report-ready outputs.
- Keep units consistent across exports (e.g., temperatures in °C, pressures in kPa).

## Integration

Integrate calculations with CI/CD or analytics pipelines by calling the API from scripts, serverless functions, or job schedulers.

## Tips

- Validate inputs before sending to the API to avoid wasted runs.
- Use sensible tolerances for numerical comparisons and store raw results for reproducibility.
