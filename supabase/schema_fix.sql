-- 1. MESSAGES TABLE
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    contact_name TEXT,
    contact_phone TEXT NOT NULL,
    content TEXT NOT NULL,
    direction TEXT CHECK (direction IN ('inbound', 'outbound')) NOT NULL,
    status TEXT CHECK (status IN ('new', 'read', 'replied', 'archived', 'ai_handled')) DEFAULT 'new',
    platform TEXT DEFAULT 'whatsapp',
    is_ai_generated BOOLEAN DEFAULT FALSE
);

-- Add user_id safely (idempotent)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'user_id') THEN 
        ALTER TABLE messages ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF; 
END $$;


-- 2. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    currrency TEXT DEFAULT 'XAF',
    status TEXT CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
    items JSONB DEFAULT '[]'::jsonb
);

-- Add user_id safely
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'user_id') THEN 
        ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF; 
END $$;


-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    image_url TEXT
);

-- Add user_id safely
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'user_id') THEN 
        ALTER TABLE products ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF; 
END $$;


-- SECURITY POLICIES (DROP OLD TO AVOID CONFLICTS)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can insert their own messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

CREATE POLICY "Users can view their own messages" ON messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;

CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DUMMY DATA FOR TESTING (Optional - only runs if table is empty)
INSERT INTO messages (contact_name, contact_phone, content, direction, status, user_id)
SELECT 'Test Client', '+2376000000', 'Bonjour, est-ce que c''est ouvert ?', 'inbound', 'new', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM messages) AND auth.uid() IS NOT NULL;
