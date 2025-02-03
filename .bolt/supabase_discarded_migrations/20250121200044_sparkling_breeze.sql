-- Set Resend API key as database configuration parameter
ALTER DATABASE postgres
SET app.settings.resend_api_key = 're_M8usDBs4_MRCeCZksCpS9bR1h27UBVoh8';

-- Ensure the parameter is accessible
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated, anon;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, authenticated, anon;