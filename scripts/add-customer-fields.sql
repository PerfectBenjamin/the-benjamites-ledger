-- Add repayment account and guarantor fields to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS account_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS guarantor1_name TEXT,
ADD COLUMN IF NOT EXISTS guarantor1_phone TEXT,
ADD COLUMN IF NOT EXISTS guarantor1_address TEXT,
ADD COLUMN IF NOT EXISTS guarantor2_name TEXT,
ADD COLUMN IF NOT EXISTS guarantor2_phone TEXT,
ADD COLUMN IF NOT EXISTS guarantor2_address TEXT;
