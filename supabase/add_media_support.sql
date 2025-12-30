-- Migration: Add media support to messages table
-- Run this in Supabase SQL Editor

-- Add columns for media support
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS media_url TEXT;

-- Create storage bucket for WhatsApp media (run once)
-- NOTE: Do this in Supabase Dashboard > Storage > New Bucket > Name: "whatsapp-media" > Public: ON
