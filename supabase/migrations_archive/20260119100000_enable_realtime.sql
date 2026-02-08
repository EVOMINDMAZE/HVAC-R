DO $$
BEGIN
  -- Enable Realtime for telemetry_readings (Required for n8n trigger)
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'telemetry_readings') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE telemetry_readings;
  END IF;

  -- Enable Realtime for rules_alerts (Required for Dashboard updates)
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'rules_alerts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE rules_alerts;
  END IF;
END $$;
