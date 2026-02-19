-- ============================================
-- SUPABASE INVOICE PRO DATABASE SETUP (FIXED)
-- ============================================
-- Run each section in Supabase SQL Editor
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

DROP POLICY IF EXISTS "Enable insert for own profile" ON profiles;
CREATE POLICY "Enable insert for own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
CREATE POLICY "Enable update for own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on new user signup (trigger)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================
-- 2. SELLER INFO TABLE
-- ============================================
-- Stores the logged-in user's own business info
CREATE TABLE IF NOT EXISTS seller_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  gst_no VARCHAR(15) DEFAULT 'N/A',
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(100),
  state_code VARCHAR(2),
  pincode VARCHAR(10),
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
-- 3. BANK DETAILS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bank_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name VARCHAR(255) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  ifsc_code VARCHAR(11) NOT NULL,
  branch VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE bank_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all for own bank details" ON bank_details;
CREATE POLICY "Enable all for own bank details" ON bank_details
  FOR ALL USING (auth.uid() = user_id);


-- ============================================
-- 4. INVENTORY ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,        -- Item name
  hsn VARCHAR(20),                   -- HSN/SAC code
  category TEXT,                     -- Item category (e.g. Electronics, Clothing)
  rate DECIMAL(10,2) NOT NULL,       -- Selling price per unit
  stock INT NOT NULL DEFAULT 0,      -- Current stock quantity
  unit VARCHAR(50) NOT NULL,         -- Unit of measure (pcs, kg, etc.)
  gst_rate DECIMAL(5,2) DEFAULT 0,   -- GST rate percentage
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
-- 5. COMPANIES (CUSTOMERS / VENDORS) TABLE
-- ============================================
-- ✅ FIXED: Uses 'phone' (not 'contact_no') to match TypeScript code
-- ✅ FIXED: Uses only 'pending_amount' (removed opening_balance)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,           -- Customer/Vendor name
  gst_no VARCHAR(15) DEFAULT 'N/A',     -- GST Number (defaults to N/A)
  phone VARCHAR(20),
  email VARCHAR(255),
  address VARCHAR(500),                 -- Full address
  state VARCHAR(100),
  state_code VARCHAR(2),
  pending_amount DECIMAL(12,2) DEFAULT 0,
  last_transaction TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

DROP INDEX IF EXISTS companies_user_id_idx;
CREATE INDEX companies_user_id_idx ON companies(user_id);

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
-- 6. INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  total_amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  amount_received DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
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
-- 7. INVOICE LINE ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id),
  item_name VARCHAR(255),
  item_hsn VARCHAR(20),
  item_unit VARCHAR(50),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

DROP INDEX IF EXISTS invoice_line_items_invoice_id_idx;
CREATE INDEX invoice_line_items_invoice_id_idx ON invoice_line_items(invoice_id);

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- RLS using subquery to check ownership through invoice
DROP POLICY IF EXISTS "Enable all access based on invoice" ON invoice_line_items;
CREATE POLICY "Enable all access based on invoice" ON invoice_line_items
  FOR ALL USING (
    invoice_id IN (SELECT id FROM invoices WHERE auth.uid() = user_id)
  );


-- ============================================
-- 8. SEED ADMIN USER PROFILE (OPTIONAL)
-- ============================================
-- Only runs if you have a user with email 'admin@gmail.com'
INSERT INTO profiles (id, email, name, role)
SELECT
  id,
  email,
  'Admin User',
  'admin'
FROM auth.users
WHERE email = 'admin@gmail.com'
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 10. SCHEMA REFRESH (RUN THIS IF YOU SEE SCHEMA CACHE ERRORS)
-- ============================================
-- Ensure columns exist even if table was already created

-- Add missing columns to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS gst_no VARCHAR(15) DEFAULT 'N/A';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add missing columns to seller_info
ALTER TABLE seller_info ADD COLUMN IF NOT EXISTS gst_no VARCHAR(15) DEFAULT 'N/A';

-- Add missing columns to inventory_items
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS hsn VARCHAR(20);
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(5,2) DEFAULT 0;

-- Add missing columns to invoice_line_items
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS item_name VARCHAR(255);
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS item_hsn VARCHAR(20);
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS item_unit VARCHAR(50);
ALTER TABLE invoice_line_items ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 0;

-- Add missing columns to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS amount_received DECIMAL(12,2) DEFAULT 0;

-- Update existing NULL values to 'N/A'
UPDATE companies SET gst_no = 'N/A' WHERE gst_no IS NULL;
UPDATE seller_info SET gst_no = 'N/A' WHERE gst_no IS NULL;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- END OF SETUP
-- ============================================
