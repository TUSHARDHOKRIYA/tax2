-- Run this in your Supabase SQL Editor to add the category column

ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS category text;
