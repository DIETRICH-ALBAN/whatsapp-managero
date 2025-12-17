-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    
    is_ai_generated BOOLEAN DEFAULT FALSE,
    user_id UUID REFERENCES auth.users(id)
);

-- 2. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    
    total_amount DECIMAL(10, 2) DEFAULT 0.00,
    currrency TEXT DEFAULT 'XAF',
    status TEXT CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
    
    items JSONB DEFAULT '[]'::jsonb, -- Stores array of { name, quantity, price }
    user_id UUID REFERENCES auth.users(id)
);

-- 3. PRODUCTS TABLE (For Inventory)
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    
    image_url TEXT,
    user_id UUID REFERENCES auth.users(id)
);

-- RLS POLICIES (Security)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own data
CREATE POLICY "Users can view their own messages" ON messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own messages" ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own messages" ON messages FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own orders" ON orders FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own products" ON products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own products" ON products FOR ALL USING (auth.uid() = user_id);


-- INSERT SOME DUMMY DATA (For Testing)
-- Note: You might need to replace 'auth.uid()' with a real user ID if running manually in SQL Editor without session context, 
-- or just rely on the app to create data.

-- But safely, we can insert rows if we don't enforce user_id heavily in the INSERT for testing, 
-- OR strictly relying on the user to login first.
