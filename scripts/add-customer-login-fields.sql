-- Add customer login fields for customer ID + PIN login
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS customer_code TEXT,
ADD COLUMN IF NOT EXISTS pin_hash TEXT,
ADD COLUMN IF NOT EXISTS pin_reset_required BOOLEAN NOT NULL DEFAULT TRUE;

-- Backfill customer_code for existing rows that do not yet have one.
-- This uses UUID-derived codes to avoid collisions in practice.
UPDATE customers
SET customer_code = CONCAT('CUS-', UPPER(SUBSTRING(REPLACE(id::TEXT, '-', '') FROM 1 FOR 12)))
WHERE customer_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);

COMMENT ON COLUMN customers.customer_code IS 'Public customer login ID shown to debtor, e.g. CUS-ABC123';
COMMENT ON COLUMN customers.pin_hash IS 'Hashed customer PIN';
COMMENT ON COLUMN customers.pin_reset_required IS 'Force customer to change default PIN on first login';
