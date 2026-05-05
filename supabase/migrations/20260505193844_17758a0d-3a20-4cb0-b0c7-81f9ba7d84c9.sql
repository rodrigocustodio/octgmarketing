
DO $$
DECLARE
  v_secret text := 'd561478bc5acf7cb0aa5c765f9adf498c43f8ee2632da8b6ca3eeba59a828164';
  v_id uuid;
BEGIN
  SELECT id INTO v_id FROM vault.secrets WHERE name='CRON_SECRET';
  IF v_id IS NULL THEN
    PERFORM vault.create_secret(v_secret, 'CRON_SECRET', 'pg_cron -> edge function');
  ELSE
    PERFORM vault.update_secret(v_id, v_secret, 'CRON_SECRET', 'pg_cron -> edge function');
  END IF;
END $$;
