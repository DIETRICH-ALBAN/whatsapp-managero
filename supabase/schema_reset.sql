-- ⚠️ RESET SCRIPT: DROPS AND RECREATES TABLES
-- Run this in Supabase SQL Editor to fix structure mismatch errors.

-- 1. DROP OLD TABLES (Clean Slate)
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- 2. CREATE MESSAGES TABLE (Correct Structure)
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    
    contact_name TEXT,
    contact_phone TEXT NOT NULL,
    content TEXT NOT NULL,
    
    direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
    status TEXT CHECK (status IN ('new', 'read', 'replied', 'archived', 'ai_handled')) DEFAULT 'new',
    platform TEXT DEFAULT 'whatsapp',
    
    is_ai_generated BOOLEAN DEFAULT FALSE
);

-- 3. CREATE ORDERS TABLE
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    currrency TEXT DEFAULT 'XAF',
    status TEXT CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
    
    items JSONB DEFAULT '[]'::jsonb
);

-- 4. CREATE PRODUCTS TABLE
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    
    image_url TEXT
);

-- 5. ENABLE SECURITY (RLS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES (Simple & Robust)
CREATE POLICY "Users can manage their own messages" ON messages FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own orders" ON orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own products" ON products FOR ALL USING (auth.uid() = user_id);

-- 7. DUMMY DATA (Optional - injects data for the current user executing the script)
-- Note: In SQL Editor, 'auth.uid()' might be null depending on context. 
-- We try to insert only if we can verify a user context, otherwise strictly schema creation.

INSERT INTO messages (contact_name, contact_phone, content, direction, status, user_id)
SELECT 'Test Client', '+2376000000', 'Bonjour, est-ce que c''est ouvert ?', 'inbound', 'new', auth.uid()
WHERE auth.uid() IS NOT NULL;
