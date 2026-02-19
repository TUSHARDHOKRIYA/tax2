-- ============================================
-- TAXPRINT PRO - FINAL COMPLETE DATABASE SETUP (CORRECTED)
-- ============================================
-- Run this entire script in Supabase SQL Editor
-- ============================================


-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for own profile" ON profiles;
CREATE POLICY "Enable read access for own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
CREATE POLICY "Enable update for own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);


-- ============================================
-- 2. COMPANIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address VARCHAR(500),
  state VARCHAR(100),
  state_code VARCHAR(2),
  gst_no VARCHAR(15),
  pending_amount DECIMAL(12,2) DEFAULT 0,
  last_transaction TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at TIMESTAMP
);

ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_user_id_gst_no_key;

DROP INDEX IF EXISTS companies_user_id_idx;
CREATE INDEX companies_user_id_idx ON companies(user_id);

-- Ensure soft-delete columns exist for existing databases
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

DROP INDEX IF EXISTS companies_user_id_active_idx;
CREATE INDEX companies_user_id_active_idx
  ON companies(user_id)
  WHERE is_deleted = FALSE;


-- ============================================
-- 2b. COMPANY PAYMENTS (BALANCE HISTORY)
-- ============================================
CREATE TABLE IF NOT EXISTS company_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  previous_balance DECIMAL(12,2) NOT NULL,
  new_balance DECIMAL(12,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

DROP INDEX IF EXISTS company_payments_user_id_idx;
DROP INDEX IF EXISTS company_payments_company_id_idx;
CREATE INDEX company_payments_user_id_idx ON company_payments(user_id);
CREATE INDEX company_payments_company_id_idx ON company_payments(company_id);

ALTER TABLE company_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for user company payments" ON company_payments;
CREATE POLICY "Enable read for user company payments" ON company_payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable insert for user company payments" ON company_payments;
CREATE POLICY "Enable insert for user company payments" ON company_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for user company payments" ON company_payments;
CREATE POLICY "Enable delete for user company payments" ON company_payments
  FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for user companies" ON companies;
CREATE POLICY "Enable read for user companies" ON companies
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable insert for user companies" ON companies;
CREATE POLICY "Enable insert for user companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for user companies" ON companies;
CREATE POLICY "Enable update for user companies" ON companies
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for user companies" ON companies;
CREATE POLICY "Enable delete for user companies" ON companies
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- 3. INVENTORY ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  hsn VARCHAR(8) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL,
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

DROP INDEX IF EXISTS inventory_items_user_id_idx;
CREATE INDEX inventory_items_user_id_idx ON inventory_items(user_id);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for user items" ON inventory_items;
CREATE POLICY "Enable read for user items" ON inventory_items
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable insert for user items" ON inventory_items;
CREATE POLICY "Enable insert for user items" ON inventory_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for user items" ON inventory_items;
CREATE POLICY "Enable update for user items" ON inventory_items
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for user items" ON inventory_items;
CREATE POLICY "Enable delete for user items" ON inventory_items
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- 4. INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  total_amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL,
  amount_received DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'updated')),
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

DROP INDEX IF EXISTS invoices_user_id_idx;
DROP INDEX IF EXISTS invoices_company_id_idx;
CREATE INDEX invoices_user_id_idx ON invoices(user_id);
CREATE INDEX invoices_company_id_idx ON invoices(company_id);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read for user invoices" ON invoices;
CREATE POLICY "Enable read for user invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable insert for user invoices" ON invoices;
CREATE POLICY "Enable insert for user invoices" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable update for user invoices" ON invoices;
CREATE POLICY "Enable update for user invoices" ON invoices
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Enable delete for user invoices" ON invoices;
CREATE POLICY "Enable delete for user invoices" ON invoices
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- 5. INVOICE LINE ITEMS TABLE (FIXED FOR TEMPORARY ITEMS)
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id),
  item_name VARCHAR(255),
  item_hsn VARCHAR(8),
  item_unit VARCHAR(50),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

DROP INDEX IF EXISTS invoice_line_items_invoice_id_idx;
CREATE INDEX invoice_line_items_invoice_id_idx ON invoice_line_items(invoice_id);

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access based on invoice" ON invoice_line_items;
CREATE POLICY "Enable all access based on invoice" ON invoice_line_items
  FOR ALL USING (
    invoice_id IN (SELECT id FROM invoices WHERE auth.uid() = user_id)
  );


-- ============================================
-- 6. SELLER INFO TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS seller_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(100),
  state_code VARCHAR(2),
  pincode VARCHAR(10),
  gst_no VARCHAR(15),
  pan VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE seller_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for own seller info" ON seller_info;
CREATE POLICY "Enable all for own seller info" ON seller_info
  FOR ALL USING (auth.uid() = user_id);


-- ============================================
-- 7. BANK DETAILS TABLE (NULLABLE FIELDS)
-- ============================================
CREATE TABLE IF NOT EXISTS bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name VARCHAR(255),
  account_name VARCHAR(255),
  account_number VARCHAR(20),
  ifsc_code VARCHAR(11),
  branch VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Remove NOT NULL constraints from existing table
ALTER TABLE bank_details ALTER COLUMN bank_name DROP NOT NULL;
ALTER TABLE bank_details ALTER COLUMN account_name DROP NOT NULL;
ALTER TABLE bank_details ALTER COLUMN account_number DROP NOT NULL;
ALTER TABLE bank_details ALTER COLUMN ifsc_code DROP NOT NULL;

ALTER TABLE bank_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for own bank details" ON bank_details;
CREATE POLICY "Enable all for own bank details" ON bank_details
  FOR ALL USING (auth.uid() = user_id);


-- ============================================
-- 8. CREATE EMPTY RECORDS FOR EXISTING USERS
-- ============================================

-- Insert EMPTY seller_info for users who don't have one
INSERT INTO seller_info (user_id)
SELECT id
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM seller_info)
ON CONFLICT (user_id) DO NOTHING;

-- Insert EMPTY bank_details for users who don't have one
INSERT INTO bank_details (user_id)
SELECT id
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM bank_details)
ON CONFLICT (user_id) DO NOTHING;


-- ============================================
-- 9. UPDATE STATUS CONSTRAINT FOR EDIT FEATURE
-- ============================================
-- This updates the existing constraint to allow 'updated' status
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'updated'));


-- ============================================
-- 10. AUTOMATIC PURGE OF SOFT-DELETED COMPANIES
-- ============================================
-- Requires pg_cron extension (enabled by default in many Supabase projects).
-- This will permanently delete companies (and cascading data) 30 days after they
-- have been moved to the junk bin (is_deleted = TRUE).

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION purge_old_deleted_companies()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM companies
  WHERE is_deleted = TRUE
    AND deleted_at IS NOT NULL
    AND deleted_at < NOW() - INTERVAL '30 days';
END;
$$;

DO $$
BEGIN
  -- Only create the cron job if it does not already exist
  IF NOT EXISTS (
    SELECT 1
    FROM cron.job
    WHERE jobname = 'purge_old_deleted_companies_daily'
  ) THEN
    PERFORM cron.schedule(
      'purge_old_deleted_companies_daily',
      '0 3 * * *',
      'SELECT purge_old_deleted_companies();'
    );
  END IF;
END;
$$;

-- ============================================
-- 11. REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';


-- ============================================
-- SETUP COMPLETE!
-- ============================================
