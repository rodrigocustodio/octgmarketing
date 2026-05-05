
-- Ensure vault extension is available
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- Create or replace the CRON_SECRET in vault with a freshly generated value
DO $$
DECLARE
  new_secret text := encode(gen_random_bytes(32), 'hex');
  existing_id uuid;
BEGIN
  SELECT id INTO existing_id FROM vault.secrets WHERE name = 'CRON_SECRET';
  IF existing_id IS NULL THEN
    PERFORM vault.create_secret(new_secret, 'CRON_SECRET', 'Shared secret for pg_cron -> edge function auth');
  END IF;
END $$;

-- Unschedule and reschedule the cron with a fresh command (same schedule)
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
      'x-cron-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name='CRON_SECRET' LIMIT 1)
    ),
    body := '{}'::jsonb
  );
  $cmd$
);
