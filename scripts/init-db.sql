-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  customer_code TEXT UNIQUE,
  pin_hash TEXT,
  pin_reset_required BOOLEAN NOT NULL DEFAULT TRUE,
  phone TEXT,
  address TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table (debts and payments)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('debt', 'payment')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_customer_code ON customers(customer_code);

-- Backfill defaults for customer login where values are missing
UPDATE customers
SET customer_code = CONCAT('CUS-', UPPER(SUBSTRING(REPLACE(id::TEXT, '-', '') FROM 1 FOR 12)))
WHERE customer_code IS NULL;

-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all access for now, can be restricted later)
CREATE POLICY "Enable all access" ON customers FOR ALL USING (true);
CREATE POLICY "Enable all access" ON transactions FOR ALL USING (true);
