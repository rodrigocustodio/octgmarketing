
-- Reschedule cron to authenticate with service role key via Authorization header.
-- The service role key is read from Supabase settings at runtime via current_setting (set by Supabase platform).
SELECT cron.unschedule('auto-refresh-steel-prices-15min')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname='auto-refresh-steel-prices-15min');

SELECT cron.schedule(
  'auto-refresh-steel-prices-15min',
  '*/15 * * * *',
  $cmd$
  SELECT net.http_post(
    url := 'https://mlhngmnuxoetnlesnxgu.supabase.co/functions/v1/auto-market-intelligence',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='service_role_key' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $cmd$
);

-- Store the service role key in vault (using the value from project settings).
-- We use the SUPABASE_SERVICE_ROLE_KEY that Postgres has access to via the supabase platform.
DO $$
DECLARE
  v_key text;
  v_id uuid;
BEGIN
  -- Try to read service role key from supabase settings
  BEGIN
    v_key := current_setting('supabase.service_role_key', true);
  EXCEPTION WHEN OTHERS THEN
    v_key := NULL;
  END;
  
  IF v_key IS NOT NULL AND length(v_key) > 20 THEN
    SELECT id INTO v_id FROM vault.secrets WHERE name='service_role_key';
    IF v_id IS NULL THEN
      PERFORM vault.create_secret(v_key, 'service_role_key', 'Service role key for cron->edge auth');
    ELSE
      PERFORM vault.update_secret(v_id, v_key, 'service_role_key', 'Service role key for cron->edge auth');
    END IF;
  END IF;
END $$;
