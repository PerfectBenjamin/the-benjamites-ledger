-- Create a simple key/value table for app settings (store hashed PIN here)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT
);

-- To set a hashed PIN (example, replace <hash> with bcrypt hash):
-- INSERT INTO app_settings (key, value) VALUES ('delete_pin', '<hash>');
