-- ============================================
-- SUPABASE TAXPRINT PRO DATABASE SETUP
-- ============================================
-- Copy and paste each section below into Supabase SQL Editor
-- Click "Run" after each section
-- ============================================


-- ============================================
-- 1. USERS / PROFILES TABLE
-- ============================================
-- Stores user profile information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
DROP POLICY IF EXISTS "Enable read access for own profile" ON profiles;
CREATE POLICY "Enable read access for own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Enable update for own profile" ON profiles;
CREATE POLICY "Enable update for own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);


-- ============================================
-- 2. COMPANIES TABLE
-- ============================================
-- Stores customer/vendor company information
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address VARCHAR(500),
  state VARCHAR(100),
  state_code VARCHAR(2),
  gst_no VARCHAR(15),                   -- Made optional
  pending_amount DECIMAL(12,2) DEFAULT 0,
  last_transaction TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster user company lookups
DROP INDEX IF EXISTS companies_user_id_idx;
CREATE INDEX companies_user_id_idx ON companies(user_id);

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read only their own companies
DROP POLICY IF EXISTS "Enable read for user companies" ON companies;
CREATE POLICY "Enable read for user companies" ON companies
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own companies
DROP POLICY IF EXISTS "Enable insert for user companies" ON companies;
CREATE POLICY "Enable insert for user companies" ON companies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own companies
DROP POLICY IF EXISTS "Enable update for user companies" ON companies;
CREATE POLICY "Enable update for user companies" ON companies
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own companies
DROP POLICY IF EXISTS "Enable delete for user companies" ON companies;
CREATE POLICY "Enable delete for user companies" ON companies
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- 3. INVENTORY ITEMS TABLE
-- ============================================
-- Stores product/inventory item information
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  hsn VARCHAR(8) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL,
  unit VARCHAR(50) NOT NULL,
  gst_rate DECIMAL(5,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster user inventory lookups
DROP INDEX IF EXISTS inventory_items_user_id_idx;
CREATE INDEX inventory_items_user_id_idx ON inventory_items(user_id);

-- Enable Row Level Security
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own inventory items
DROP POLICY IF EXISTS "Enable read for user items" ON inventory_items;
CREATE POLICY "Enable read for user items" ON inventory_items
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own inventory items
DROP POLICY IF EXISTS "Enable insert for user items" ON inventory_items;
CREATE POLICY "Enable insert for user items" ON inventory_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own inventory items
DROP POLICY IF EXISTS "Enable update for user items" ON inventory_items;
CREATE POLICY "Enable update for user items" ON inventory_items
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own inventory items
DROP POLICY IF EXISTS "Enable delete for user items" ON inventory_items;
CREATE POLICY "Enable delete for user items" ON inventory_items
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- 4. INVOICES TABLE
-- ============================================
-- Stores invoice header information
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  total_amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'updated')),
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for faster queries
DROP INDEX IF EXISTS invoices_user_id_idx;
DROP INDEX IF EXISTS invoices_company_id_idx;
CREATE INDEX invoices_user_id_idx ON invoices(user_id);
CREATE INDEX invoices_company_id_idx ON invoices(company_id);

-- Enable Row Level Security
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own invoices
DROP POLICY IF EXISTS "Enable read for user invoices" ON invoices;
CREATE POLICY "Enable read for user invoices" ON invoices
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own invoices
DROP POLICY IF EXISTS "Enable insert for user invoices" ON invoices;
CREATE POLICY "Enable insert for user invoices" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own invoices
DROP POLICY IF EXISTS "Enable update for user invoices" ON invoices;
CREATE POLICY "Enable update for user invoices" ON invoices
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own invoices
DROP POLICY IF EXISTS "Enable delete for user invoices" ON invoices;
CREATE POLICY "Enable delete for user invoices" ON invoices
  FOR DELETE USING (auth.uid() = user_id);


-- ============================================
-- 5. INVOICE LINE ITEMS TABLE
-- ============================================
-- Stores individual line items within invoices
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster line item lookups
DROP INDEX IF EXISTS invoice_line_items_invoice_id_idx;
CREATE INDEX invoice_line_items_invoice_id_idx ON invoice_line_items(invoice_id);

-- Enable Row Level Security
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access line items only if they own the invoice
DROP POLICY IF EXISTS "Enable all access based on invoice" ON invoice_line_items;
CREATE POLICY "Enable all access based on invoice" ON invoice_line_items
  FOR ALL USING (
    invoice_id IN (SELECT id FROM invoices WHERE auth.uid() = user_id)
  );


-- ============================================
-- 6. SELLER INFO TABLE
-- ============================================
-- Stores information about the seller/business
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

-- Enable Row Level Security
ALTER TABLE seller_info ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access their own seller info only
DROP POLICY IF EXISTS "Enable all for own seller info" ON seller_info;
CREATE POLICY "Enable all for own seller info" ON seller_info
  FOR ALL USING (auth.uid() = user_id);


-- ============================================
-- 7. BANK DETAILS TABLE
-- ============================================
-- Stores bank account information
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

-- Enable Row Level Security
ALTER TABLE bank_details ENABLE ROW LEVEL SECURITY;

-- Policy: Users can access their own bank details only
DROP POLICY IF EXISTS "Enable all for own bank details" ON bank_details;
CREATE POLICY "Enable all for own bank details" ON bank_details
  FOR ALL USING (auth.uid() = user_id);


-- ============================================
-- 8. SEED ADMIN USER PROFILE
-- ============================================
-- This adds the admin user to the profiles table
-- (The admin user is created separately in Supabase Auth)
INSERT INTO profiles (id, email, name, role)
SELECT 
  id,
  email,
  'Admin User',
  'admin'
FROM auth.users
WHERE email = 'admin'
ON CONFLICT DO NOTHING;


-- ============================================
-- 9. ADD CATEGORY COLUMN TO INVENTORY ITEMS
-- ============================================
-- Run this to add the category column if it's missing
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS category text;

-- ============================================
-- 10. SCHEMA REFRESH (RUN THIS IF YOU SEE SCHEMA CACHE ERRORS)
-- ============================================
-- Ensure columns exist even if table was already created
ALTER TABLE companies ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE companies ALTER COLUMN gst_no DROP NOT NULL;

-- Remove the unique constraint that prevents multiple companies with 'NA' or empty GST
ALTER TABLE companies DROP CONSTRAINT IF EXISTS companies_user_id_gst_no_key;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- END OF DATABASE SETUP
-- ============================================
