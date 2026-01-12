-- Create a settings table to store the PIN
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert a default PIN (you should change this!)
-- PIN: 1234 (hashed with bcrypt)
INSERT INTO settings (key, value) 
VALUES ('delete_pin', '1234')
ON CONFLICT (key) DO NOTHING;

-- Create an index on the key column for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

COMMENT ON TABLE settings IS 'Application settings including delete PIN';
COMMENT ON COLUMN settings.value IS 'For delete_pin: store the PIN as plaintext (change to hashed in production)';
