-- Increase transactions.amount precision to support large values (e.g., 100,000,000.00)
-- Change numeric precision to 14 total digits with 2 decimal places (up to 999,999,999,999.99)

ALTER TABLE transactions
ALTER COLUMN amount TYPE numeric(14,2)
USING amount::numeric;

-- Verify change:
-- SELECT column_name, data_type, numeric_precision, numeric_scale
-- FROM information_schema.columns
-- WHERE table_name = 'transactions' AND column_name = 'amount';
