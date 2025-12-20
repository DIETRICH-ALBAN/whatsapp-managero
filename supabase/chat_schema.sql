-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CONVERSATIONS TABLE (Aggregates messages by contact)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    contact_phone TEXT NOT NULL UNIQUE, -- Unique constraint to ensure one convo per phone
    contact_name TEXT,
    contact_avatar TEXT,
    
    last_message TEXT, -- Preview of the last message
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    
    unread_count INTEGER DEFAULT 0,
    status TEXT CHECK (status IN ('active', 'archived', 'blocked')) DEFAULT 'active',
    
    -- Optional: Linked to a specific system user eventually
    user_id UUID REFERENCES auth.users(id)
);

-- 2. UPDATE MESSAGES TABLE (Link to conversations)
-- Check if column exists, if not add it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='conversation_id') THEN
        ALTER TABLE messages ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_contact_phone ON conversations(contact_phone);

-- 3. RLS POLICIES FOR CONVERSATIONS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view discussions (MVP: All admins see all chats)
CREATE POLICY "Admins can view all conversations" ON conversations FOR ALL USING (auth.role() = 'authenticated');

-- Update Messages RLS to be consistent
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
CREATE POLICY "Admins can view all messages" ON messages FOR ALL USING (auth.role() = 'authenticated');

-- 4. FUNCTION TO HANDLE NEW MESSAGE (Optional, can be done in code but SQL is faster)
-- Trigger to update conversation updated_at on new message? 
-- Let's do it in the application code for now to assume control over logic.
